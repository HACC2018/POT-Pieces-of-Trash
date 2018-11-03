
from skimage.morphology import label, square, opening, closing

import cv2
import numpy as np


class ConnectedComponentBoundingBox(object):
    """ Create "chips" based on bounding boxes of components

    Attributes
    ==========
    min_size - int
        The minimum number of pixels for a component to be valid
    
    opening_size - int
        The size of the neighborhood to use as part of the "opening" 
        transform.  This is used to remove "spots" in the image.

    closing_size - int
        The size of the neighborhood to use as part of the "closing"
        transform.  This removes holes.  Larger = larger hole removal

    """
    
    def __init__(self, min_size=500, opening_size=3, closing_size=20,
                 min_width=20, min_height=20):
        """
        """
        
        self.min_size = min_size
        self.opening_size = opening_size
        self.closing_size = closing_size
        self.min_width = min_width
        self.min_height = min_height
    
    def get_bounding_boxes(self, binarized_image):
        """ Get the bounding boxes for objects in the image
        
        This class accepts a binarized image and the filters using 
        various morphological operations and size constraints.  For 
        speed we use OpenCV wherever possible. 
        """
        
        # Convert from boolean to uint8
        binarized_image = 255*binarized_image.astype("uint8")
        
        # Perform an opening transform to remove spots
        binarized_image = cv2.morphologyEx(binarized_image, cv2.MORPH_OPEN, np.ones(self.opening_size, dtype="uint8"))
                
        # And a closing to remove holes
        binarized_image = cv2.morphologyEx(binarized_image, cv2.MORPH_CLOSE, np.ones(self.closing_size, dtype="uint8"))

        # Compute the connected components
        max_num, connected_components = cv2.connectedComponents(binarized_image)

        # Bounding box computation

        # Create an array of indexes        
        cc, rr = np.meshgrid(np.arange(binarized_image.shape[1]), np.arange(binarized_image.shape[0]))
           
        #For each bounding box, check the size constraints 
        component_bounds = []
        for ii in range(1, max_num):
        
            mask = connected_components == ii
            
            # Violates absolute count constraints
            if np.sum(mask.ravel()) < self.min_size:
                continue
            
            rows = rr[mask]
            cols = cc[mask]
            
            bbox = (min(rows), min(cols), max(rows), max(cols))
            
            # Violates width and height constraints
            if bbox[2] - bbox[0] < self.min_height or bbox[3] - bbox[1] < self.min_width:
                continue

            component_bounds.append(bbox)
            
        return component_bounds
    
