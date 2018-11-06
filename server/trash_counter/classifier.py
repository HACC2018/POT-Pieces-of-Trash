import PIL
import torch
import pretrainedmodels
import pretrainedmodels.utils as utils
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.exceptions import NotFittedError
import numpy as np

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

    def __init__(self, 
                 classifier=LogisticRegression(),
                 feature_model=pretrainedmodels.inceptionv4(num_classes=1000, pretrained='imagenet'), 
                 image_transformer=None, image_type=None, padding=0):
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
                

    def get_features(self, image, bbox):
        """ Get the features for a bounding box in the image

        Arguments
        =========
        image - row x col x color channels array
            The image to be processed 
        
        bbox - 4 tuple of ints
            The bounding box (min_row, min_col, max_row, max_col) in pixel coordinates
        """
        
        if not isinstance(image, np.ndarray):
            image = np.array(image)
        
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


    def fit(self, features, label_list):
        """ Train the classifier

        Calling this method could overwrite any existing trainining depending 
        on the underlying classifier.  This behavior is determined by
        the underlying model. 
        """

        # We want to feed the labels as a list of ints.  Generate the mapping from strings to int
        self.label_mapping = list(set(label_list))
        label_array = np.array([self.label_mapping.index(label) for label in label_list])

        # Save the arrays for debugging
        self.classifier.fit(features, label_array)

    def predict(self, raw_image, bboxes):
        """ Return a prediction for each bounding box
        
        Returns a string with the predicted class associated with
        each bounding box.  The order of the labels will match the
        order the bounding boxes are provided in
        """
        image = np.array(raw_image.convert(self.image_type))

        feature_array = None

        for bbox in bboxes:
            features = self.get_features(image, bbox)

            if feature_array is None:
                feature_array = features.reshape((1, -1))
            else:
                feature_array = np.r_[feature_array, features.reshape((1, -1))]

        label_indexes = self.classifier.predict(feature_array)
        return [self.label_mapping[label_index] for label_index in label_indexes]
            
            


