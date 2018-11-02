
from skimage.morphology import label, square, opening, closing
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
    
    def __init__(self, min_size=20, opening_size=3, closing_size=3):
        """
        """
        
        self.min_size = min_size
        self.opening_size = opening_size
        self.closing_size = closing_size
    
    def get_bounding_boxes(self, binarized_image):
        """ Convert a binarized image into rectangular "chips"
        """
        # Perform an opening transform to remove spots
        binarized_image = opening(binarized_image, square(self.opening_size))

        # And a closing to remove holes
        binarized_image = closing(binarized_image, square(self.closing_size))

        # Compute the connected components
        connected_components, max_num = label(binarized_image, background=0, 
                                              return_num=True)
        
        component_bounds = []
        
        # For each connected component...
        for ii in range(1, max_num+1):
            
            connected_mask = connected_components == ii

            # If the blob is still too small...skip!
            if sum(connected_mask.ravel()) < self.min_size:
                continue

            # Otherwise, compute the bounding box
            rows = np.nonzero(np.any(connected_mask, axis=1))[0]
            min_row = rows[0]
            max_row = rows[-1]

            cols = np.nonzero(np.any(connected_mask, axis=0))[0]
            min_col = cols[0]
            max_col = cols[-1]
            
            component_bounds.append((min_row, min_col, max_row, max_col))
            
        return component_bounds
    
