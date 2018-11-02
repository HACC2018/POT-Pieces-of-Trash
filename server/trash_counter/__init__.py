import typing
import numpy as np

from .segmentation import NormalBackground
from .detect import ConnectedComponentBoundingBox
from .classifier import ClassifyWithDeepNetFeatures


class TrashCounter(object):
    """ Count trash in an image

    This class is responsible for detecting objects placed on top of 
    a background, drawing bounding boxes that contain those objects,
    providing an initial classification for each object, and then
    returning a dictionary with the object count.     
    """

    def __init__(self, background=NormalBackground(), detector=ConnectedComponentBoundingBox(),
                 classifier=ClassifyWithDeepNetFeatures(ask_user=True)):
        self.background = background
        self.detector = detector
        self.classifier = classifier

    def __call__(self, image):
        """ Count the trash in the provided image
        """

        # ========== Identify foreground and background pixels ===============
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

        # ==================  Return a count of the objects =================== 
        class_types = list(set(classes))

        statistics = {}
        for class_type in class_types:
            statistics[class_type] = classes.count(class_type)

        return statistics
