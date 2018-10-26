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
