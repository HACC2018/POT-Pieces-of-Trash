import random
from time import sleep


def trash_analysis(image_file):
    sleep(2)
    return {
        'starbucks': random.randint(0, 30),
        'paper cups': random.randint(0, 30),
        'straws': random.randint(0, 30),
        'forks': random.randint(0, 30),
        'knifes': random.randint(0, 30),
        'paper': random.randint(0, 30),
        'cans': random.randint(0, 30)
    }

class TrashCounter(object):
    """ Count trash in an image

    This class is responsible for detecting objects placed on top of 
    a background, drawing bounding boxes that contain those objects,
    providing an initial classification for each object, and then
    returning a dictionary with the object count.     
    """
