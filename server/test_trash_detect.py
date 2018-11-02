# -*- coding: utf-8 -*-
"""
Created on Thu Nov  1 23:37:55 2018

@author: matto
"""

import trash_counter
import PIL

if __name__ == "__main__":
    
    image = PIL.Image.open("trash1.png")
    analyzer = trash_counter.TrashCounter()
    
    out = analyzer(image)
    analyzer.classifier.fit(analyzer.classifier.data_sets)
    out = analyzer(image)
