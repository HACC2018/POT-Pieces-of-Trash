import numpy as np
import cv2 as cv
#from matplotlib import pyplot as plt

c
img = cv.imread('trash1.png')
gray = cv.cvtColor(img,cv.COLOR_BGR2GRAY)
ret, thresh = cv.threshold(gray,0,255,cv.THRESH_BINARY_INV+cv.THRESH_OTSU)

# noise removal
kernel = np.ones((3,3),np.uint8)
opening = cv.morphologyEx(thresh,cv.MORPH_OPEN,kernel, iterations = 2)
# sure background area
sure_bg = cv.dilate(opening,kernel,iterations=3)
# Finding sure foreground area
dist_transform = cv.distanceTransform(opening,cv.DIST_L2,5)
ret, sure_fg = cv.threshold(dist_transform,0.7*dist_transform.max(),255,0)
# Finding unknown region
sure_fg = np.uint8(sure_fg)
unknown = cv.subtract(sure_bg,sure_fg)

# Marker labelling
ret, markers = cv.connectedComponents(sure_fg)
# Add one to all labels so that sure background is not 0, but 1
markers = markers+1
# Now, mark the region of unknown with zero
markers[unknown==255] = 0

markers = cv.watershed(img,markers)
img[markers == -1] = [0,255,0]

cv.imshow('watershed',img)

edges = cv.Canny(img,100,200)
cv.imshow('canny',edges)


img2 = img.copy()
markers1 = markers.astype(np.uint8)
ret, m2 = cv.threshold(markers1, 0, 255, cv.THRESH_BINARY|cv.THRESH_OTSU)
cv.imshow('m2', m2)
_, contours, hierarchy = cv.findContours(m2, cv.RETR_LIST, cv.CHAIN_APPROX_NONE)    
i = 0
for c in contours:
#    img2 = img.copy()
#    cv.waitKey(0)
    print(c)
    cv.drawContours(img2, c, -1, (0, 255, 0), 2)
    i += 1

#cv.imshow('markers1', markers1)
cv.imshow('contours', img2)




cv.waitKey(0)
cv.destroyAllWindows()
