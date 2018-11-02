import numpy as np


class NormalBackground(object):
    """
    We believe we know something about the statistics of the background.
    This class contains that information under the assumption the 
    color distribution in the background is normal.
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
        # Reshape to an n x 3 array
        image_array = np.array(image.convert("RGB")).reshape((-1, 3))
        
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
    
    def get_background_mask(self, image, threshold=2.0):
        """ Get a mask that is true for background pixels

        Returns a numpy array that is True for pixels believed to be 
        background pixels.  This particular method looks for pixels that
        are more than "threshold" standard deviations away from the mean.
        """

        image = np.array(image.convert("RGB"))

        mask = np.apply_along_axis(lambda x: np.linalg.norm((x - self.mean)/self.std) <= threshold, 2, image)
        return mask

    