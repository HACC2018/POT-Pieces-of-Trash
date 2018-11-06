# -*- coding: utf-8 -*-
"""
Created on Thu Nov  1 23:37:55 2018

@author: matto
"""

import trash_counter
import numpy as np
import pickle

def make_train_data(fname="data/features.pkl"):
    analyzer = trash_counter.TrashCounter()   
    images = ["train_trash_{0}.jpg".format(ii) for ii in range(1, 3)]
    features = analyzer.make_data(images)
    pickle.dump(np.array(features), open(fname, "wb"))
    
    
def train_model(analyer, features="data/features.pkl", labels="data/labels.txt"):
    labels = [line.strip() for line in open(labels, encoding="ascii") if line.strip()]
    features = pickle.load(open(features, "rb"))
    
    analyzer.classifier.fit(features, labels)    
    

if __name__ == "__main__":
    
    analyzer = trash_counter.TrashCounter()
    train_model(analyzer)
    
    report = analyzer("data/test_trash_1.jpg")
    report = analyzer("data/test_trash_2.png")
