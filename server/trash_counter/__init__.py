import typing
import numpy as np

from .segmentation import NormalBackground
from .detect import ConnectedComponentBoundingBox
from .classifier import ClassifyWithDeepNetFeatures
import pylab as pyl
import PIL
import os 
import uuid

def plot_bbox(bound):
    
    min_row, min_col, max_row, max_col = bound
    
    pyl.plot([min_col, min_col], [min_row, max_row], 'r-')
    pyl.plot([max_col, max_col], [min_row, max_row], 'r-')
    pyl.plot([min_col, max_col], [min_row, min_row], 'r-')
    pyl.plot([min_col, max_col], [max_row, max_row], 'r-')



class TrashCounter(object):
    """ Count trash in an image

    This class is responsible for detecting objects placed on top of 
    a background, drawing bounding boxes that contain those objects,
    providing an initial classification for each object, and then
    returning a dictionary with the object count.     
    """

    def __init__(self, background=NormalBackground(), detector=ConnectedComponentBoundingBox(),
                 classifier=ClassifyWithDeepNetFeatures()):
        self.background = background
        self.detector = detector
        self.classifier = classifier
        
        self.training_image_counter = 0

    def create_chip(self, image, bbox):
        """ Make an image chip from the full image
        """
        array = np.array(image)
        return PIL.Image.fromarray(array[bbox[0]:bbox[2], bbox[1]:bbox[3], :])


    def make_data_image(self, fname, chip_directory="chips/"):
        """ Helper function to get features for training
        """
        image = PIL.Image.open(fname).convert("RGB")

        self.background.update(image)
        background_mask = self.background.get_background_mask(image)  
        foreground_mask = ~background_mask 
        # ========== Group the foreground pixels into objects ================
        bounding_boxes = self.detector.get_bounding_boxes(foreground_mask)

        # ===========  Create a data set =======================
        feature_set = []
        for bbox in bounding_boxes:
            chip = self.create_chip(image, bbox)

            chip.save(open(os.path.join(chip_directory, "image_{0}.png".format(self.training_image_counter)), "wb"))
            feature_set.append(self.classifier.get_features(image, bbox).flatten())
            self.training_image_counter += 1

        return feature_set


    def make_data(self, fname_list, chip_directory="chips/"):
        """ Function to processs images for training
        """
        feature_set = None

        for fname in fname_list:
            new_features = self.make_data_image(fname, chip_directory)

            if feature_set is None:
                feature_set = new_features
            else:
                feature_set += new_features

        return feature_set 
            
    def __call__(self, fname, image_dir="image_chips/"):
        """ Count the trash in the provided image
        """
        
        # ========== Read the Image ===========================================
        image = PIL.Image.open(fname).convert("RGB")
        
        # ========== Identify foreground and background pixels ================
        self.background.update(image)
        background_mask = self.background.get_background_mask(image)  
        foreground_mask = ~background_mask 

        # Save the foreground mask for debugging
        self.foreground_mask = foreground_mask 
        
        # ========== Group the foreground pixels into objects ================
        bounding_boxes = self.detector.get_bounding_boxes(foreground_mask)
        
        # Save the bounding boxes for debugging
        self.bounding_boxes = bounding_boxes

        # ===================== Classify the Objects ==========================
        classes = self.classifier.predict(image, bounding_boxes)
        self.classes = classes

        # =================== Return the Chips + Classes ======================
        report = []
        for bbox, label in zip(bounding_boxes, classes):
            fname = os.path.join(image_dir, uuid.uuid4().__str__()) + "_" + label + ".png"
            chip = self.create_chip(image, bbox)
            chip.save(open(fname, "wb"))
            report.append({"image_path":fname, "label":label})
            
        return report


