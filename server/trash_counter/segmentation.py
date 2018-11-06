import numpy as np
from skimage import  color

class NormalBackground(object):
    """
    We believe we know something about the statistics of the background.
    This class contains that information under the assumption the 
    color distribution in the background is normal.
    
    The underlying color space can be adjusted.  I am finding the best
    results are obtained in the Lab space, but this is a knob.
    """
    
    def __init__(self, mean=0.0, std=0.0):
        self.mean = mean
        self.std = std

    def update(self, image):
        """ 
        Estimate the mean and standard deviation of the background
        using robust statistics.  This assumes we can treat non-background
        as outliers.
        """
        # Reshape to an n x 3 in the lab space
        image_lab = color.rgb2lab(image.convert("RGB"))
        image_array = np.array(image_lab).reshape((-1, image_lab.shape[2]))
        
        # Compute the median and median absolute deviation, which are
        # robust measures of centralness and variability
        median = np.median(image_array, axis=0)
        mad = np.median(np.abs(image_array - median), axis=0)
        
        # Dirty hack to avoid singular matrices later...
        mad[mad==0] = 1e-6
        
        # For a normally distributed distribution, the mean = median, 
        # and std = 1.4826*mad
        self.mean = median
        self.std = 1.4826*mad
    
    def get_background_mask(self, image, threshold=3.0):
        """ Get a mask that is true for background pixels

        Returns a numpy array that is True for pixels believed to be 
        background pixels.  This particular method looks for pixels that
        are more than "threshold" standard deviations away from the mean.
        """

        image_lab = color.rgb2lab(image.convert("RGB"))
        
        diff = np.linalg.norm((np.array(image_lab) - self.mean)/self.std, axis=2)
        mask = diff <= threshold

        #mask = np.apply_along_axis(lambda x: np.linalg.norm((x - self.mean)/self.std) <= threshold, 2, image)
        return mask

    