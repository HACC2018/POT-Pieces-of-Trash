import PIL
import torch
import pretrainedmodels
import pretrainedmodels.utils as utils
from sklearn.neighbors import KNeighborsClassifier
from sklearn.exceptions import NotFittedError
import numpy as np
import pylab as pyl


def plot_bbox(bound):
    
    min_row, min_col, max_row, max_col = bound
    
    pyl.plot([min_col, min_col], [min_row, max_row], 'r-')
    pyl.plot([max_col, max_col], [min_row, max_row], 'r-')
    pyl.plot([min_col, max_col], [min_row, min_row], 'r-')
    pyl.plot([min_col, max_col], [max_row, max_row], 'r-')



class ClassifyWithDeepNetFeatures(object):
    """ Classify using the *features* from a deep net

    Our objective is to classify trash, but a brief search of networks out
    there did not yield any pretrained networks for trash.  We do not have
    the time or data to retrain a network from scratch.  This class is a 
    compromise.

    At its core, all this class is doing is calling a pre-canned scikit-learn
    classifier.  However, to obtain a set of more sophisticated features,
    we are using a pre-trained deep net.  The hope (since we have yet to test)
    is that one of the nets out there provides a good enough set of features
    for future analysis
    """

    def __init__(self, classifier=KNeighborsClassifier(n_neighbors=1), 
                feature_model=pretrainedmodels.inceptionv4(num_classes=1000, pretrained='imagenet'), 
                image_transformer=None, image_type=None, padding=0,
                ask_user=False):
        """
        Arguments
        =========
        classifier - Class that implements fit and predict
            The classifier that will be used.  Is assumed to follow the scikit-learn API
        
        feature_model - Class that implements "eval" and "features"
            The feature extraction model.  Assumed to follow the pretrainedmodels API 
        
        image_transformer - None or callable
            The feature model is almost certainly assuming something about the size or pixel
            distribution of the data.  The image transformer should be callable and convert
            an image to the format the feature_model is expecting.  This is IMPORTANT!

        image_type - string
            The format the image should be in.  RGB or something else

        padding - int
            The amount of padding to put around the bounding box (i.e., extra pixels to retain)
            
        ask_user - bool
            If true, ask the user to confirm solutions (or just for a soln if
            we have yet to train)
        """

        self.classifier = classifier
        self.feature_model = feature_model
        self.feature_model.eval()  # Setup the model
        
        # If it is none, then use pretrained models to get it.  Otherwise, you gotta define this
        if image_transformer is None: 
            transformer = utils.TransformImage(self.feature_model)
            self.image_transformer = lambda x: torch.autograd.Variable(transformer(x).unsqueeze(0), requires_grad=False)
        else:
            self.image_transformer = image_transformer
        
        if image_type is None:
            self.image_type = self.feature_model.input_space
        else:
            self.image_type = image_type

        self.padding = padding

        # Map strings to integers
        self.label_mapping = []
        
        self.ask_user = ask_user
        
        self.data_sets = []

    def get_features(self, image, bbox):
        """ Get the features for a bounding box in the image

        Arguments
        =========
        image - row x col x color channels array
            The image to be processed 
        
        bbox - 4 tuple of ints
            The bounding box (min_row, min_col, max_row, max_col) in pixel coordinates
        """
        min_row, min_col, max_row, max_col = bbox

        # Pad the bounding box
        min_row = max([0, min_row - self.padding])
        max_row = min([image.shape[0], max_row + self.padding])
        min_col = max([0, min_col - self.padding])
        max_col = min([image.shape[1], max_col + self.padding])

        if min_row == max_row or min_col == max_col:
            raise RuntimeError("Somehow I received a bounding box that has no width or height...check... ")

        # Extract the "chip"
        chip = image[min_row:max_row, min_col:max_col, :]
        self.chip = chip
        
        chip = PIL.Image.fromarray(chip)

        # The net is expected the chip to be of a certain size/distribution.  Make it so.
        input = self.image_transformer(chip)
        features = self.feature_model.features(input).data.numpy()
        return features


    def fit(self, data_sets):
        """ Train the classifier

        This method trains the classifier given a list of data sets.  Each data set 
        should be a dictionary with three keys:
        {
            image: the full image
            bounding_boxes: a list of bounding boxes
            labels: a list of labels
        }

        Calling this method could overwrite any existing trainining depending on the
        underlying classifier.  
        """
        feature_array = None
        label_list = []

        for image, bounding_boxes, labels in data_sets:

            image = np.array(image.convert(self.image_type))

            for bounding_box, label in zip(bounding_boxes, labels):
                features = self.get_features(image, bounding_box)
                
                if feature_array is None:
                    feature_array = features.reshape((1, -1))
                else:
                    feature_array = np.r_[feature_array, features.reshape((1, -1))]
                
                label_list.append(label)

        # We want to feed the labels as a list of ints.  Generate the mapping from strings to int
        self.label_mapping = list(set(label_list))
        label_array = np.array([self.label_mapping.index(label) for label in label_list])

        # Save the arrays for debugging
        self.training_X, self.training_Y = feature_array, label_array
        self.classifier.fit(feature_array, label_array)

    def predict(self, raw_image, bboxes):
        image = np.array(raw_image.convert(self.image_type))

        feature_array = None

        for bbox in bboxes:
            features = self.get_features(image, bbox)

            if feature_array is None:
                feature_array = features.reshape((1, -1))
            else:
                feature_array = np.r_[feature_array, features.reshape((1, -1))]

        if self.ask_user:
            try:
                
                labels = []
                for ii in range(len(feature_array)):
                    label_index = self.classifier.predict(feature_array[ii].reshape((1, -1)))
                    label = self.label_mapping[label_index.astype("int")[0]]

                    pyl.figure()
                    pyl.ion()
                    pyl.show()
                    pyl.imshow(image)
                    plot_bbox(bboxes[ii])
                    pyl.title("Is this a " + label + "?")
                    pyl.draw()
                    fig = pyl.gcf()
                    fig.canvas.manager.window.raise_()
                    pyl.pause(0.1)
                    
                    new_label = input("Input the label for this chip (or hit enter if it is correct):\n").strip()
                    
                    if new_label:
                        labels.append(new_label)
                    else:
                        labels.append(label)

                self.data_sets.append((raw_image, bboxes, labels))

                return labels

            except NotFittedError:
                labels = []
                
                for ii in range(len(feature_array)):
                    pyl.figure()
                    pyl.ion()
                    pyl.show()
                    pyl.imshow(image)
                    plot_bbox(bboxes[ii])
                    pyl.draw()
                    fig = pyl.gcf()
                    fig.canvas.manager.window.raise_()
                    pyl.pause(0.1)
                    
                    label = input("Input the label for this chip:\n")
                    pyl.close("all")            
                    labels.append(label)
                    
                self.data_sets.append((raw_image, bboxes, labels))
                return labels                
                                
                
        else:
            label_indexes = self.classifier.predict(feature_array)
            return [self.label_mapping[label_index] for label_index in label_indexes]
                
                


