import cv2
import numpy as np
from copy import deepcopy
from pathlib import Path
from typing import Union

__all__ = [
    'detect_moon',
    'circle_to_square',
    'circle_to_rectangle'
]


# helper functions

# https://stackoverflow.com/a/58126805
def ResizeWithAspectRatio(image, width=None, height=None, longer_side_val=None, inter=cv2.INTER_AREA):
    dim = None
    (h, w) = image.shape[:2]
    r = 1
    
    if longer_side_val is not None:
        if h > w and h > longer_side_val:
            height = longer_side_val
            width = None
        elif w >= h and w > longer_side_val:
            height = None
            width = longer_side_val
        else: # w & h are too short
            return (r, image)
    if width is None and height is None:
        return (r, image)
    if width is None:
        r = height / float(h)
        dim = (int(w * r), height)
    else: # height is None
        r = width / float(w)
        dim = (width, int(h * r))
    
    return (r, cv2.resize(image, dim, interpolation=inter))


# https://stackoverflow.com/a/50053219
def apply_brightness_contrast(input_img, brightness = 0, contrast = 0):
    
    if brightness != 0:
        if brightness > 0:
            shadow = brightness
            highlight = 255
        else:
            shadow = 0
            highlight = 255 + brightness
        alpha_b = (highlight - shadow)/255
        gamma_b = shadow
        
        buf = cv2.addWeighted(input_img, alpha_b, input_img, 0, gamma_b)
    else:
        buf = input_img.copy()
    
    if contrast != 0:
        f = 131*(contrast + 127)/(127*(131-contrast))
        alpha_c = f
        gamma_c = 127*(1-f)
        
        buf = cv2.addWeighted(buf, alpha_c, buf, 0, gamma_c)

    return buf


# https://stackoverflow.com/a/74813748
def get_circle_pixel_mean(image, center_x, center_y, radius) -> float:
    height = int(image.shape[0])
    width = int(image.shape[1])

    xmin = center_x - radius
    if(xmin <= 0):
        xmin = int(0)
    xmax = center_x + radius
    if(xmax >= width):
        xmax = width
    ymin = center_y - radius
    if(ymin <= 0):
        ymin = int(0)
    ymax = center_y + radius
    if(ymax >= height):
        ymax = height
    radiusSquared = radius * radius

    pixel_sum = 0
    pixel_count = 0
    for x in range(xmin, xmax):
        for y in range(ymin, ymax):
            dx = x - center_x
            dy = y - center_y
            distanceSquared = dx * dx + dy * dy

            # inside circle
            if (distanceSquared <= radiusSquared):
                pixel_sum += 0 if image[y, x] == 0 else 1
                pixel_count += 1
    
    return (pixel_sum / pixel_count)


# image brightness percentage:
# assuming input image is black/white only image, so each pixel is either 0 or 1(255)
# iterate through all the pixels in the image
# and then calculate the average of all the pixels
# the result is a float between 0~1
def calc_img_brightness_perc(image, width, height) -> float:
    pixel_sum = 0
    for x in range(0, width):
        for y in range(0, height):
            pixel_sum += 0 if image[y, x] == 0 else 1
    
    img_brightness_perc = (pixel_sum / (width*height)) # 0~1 float
    return img_brightness_perc


def cut_image_from_circle(image, height, width, x, y, radius, padding=15):
    height = int(height)
    width = int(width)
    x = int(x)
    y = int(y)
    radius = int(radius)
    
    yStart = y - radius - padding
    if (yStart < 0):
        yStart = 0
    
    yEnd = y + radius + padding
    if (yEnd > height):
        yEnd = height
    
    xStart = x - radius - padding
    if (xStart < 0):
        xStart = 0
    
    xEnd = x + radius + padding
    if (xEnd > width):
        xEnd = width
    
    return (image[yStart:yEnd, xStart:xEnd], (xStart,yStart,xEnd,yEnd))


# other functions

def circle_to_square(x, y, radius) -> tuple:
    'return: (top_left_x, top_left_y, square_width)'
    
    top_left_y = y - radius
    if (top_left_y < 0):
        top_left_y = 0
    
    top_left_x = x - radius
    if (top_left_x < 0):
        top_left_x = 0
    
    square_width = 2 * radius
    
    return (top_left_x, top_left_y, square_width)

def circle_to_rectangle(x, y, radius) -> tuple:
    'return: (top_left_x, top_left_y, bottom_right_x, bottom_right_y)'
    
    top_left_x, top_left_y, square_width = circle_to_square(x, y, radius)
    bottom_right_x = top_left_x + square_width
    bottom_right_y = top_left_y + square_width
    return (top_left_x, top_left_y, bottom_right_x, bottom_right_y)


# moon detection functions

def find_circles_in_img(image, **kwargs):
    
    for k,v in kwargs.items():
        kwargs[k] = int(v)
    
    # maximum number of circles to process,
    # if cv2.HoughCircles returns more than that, we should consider adjust above parameters
    circle_threshold = 100
    
    detected_circles = cv2.HoughCircles(
        image, cv2.HOUGH_GRADIENT,
        **kwargs
    )
    
    # can't find circles, return the whole image
    if detected_circles is None:
        return np.array([[(
            int(image.shape[1]/2),   # x
            int(image.shape[0]/2),   # y
            int(image.shape[1]/2)+3  # radius
        )]])
    
    # found too many circles
    circles_found = len(detected_circles[0, :])
    # print(f'Circles found: {circles_found}')
    if circles_found >= circle_threshold:
        raise ValueError('Found Too Many Circles.')
    
    return detected_circles


def select_circle_by_brightness_perc(image, detected_circles):
    x, y, radius = (-1,-1,-1)
    max_mean = -1
    
    if detected_circles is not None:
        for (xc, yc, rc) in detected_circles[0, :]:
            # calc circle pixel mean (brightness percentage)
            mean = get_circle_pixel_mean(image, int(xc), int(yc), int(rc))
            # find the maximum mean thats below 0.98
            if mean < 0.98 and mean > max_mean:
                x = xc
                y = yc
                radius = rc
                max_mean = mean
    
    return (x,y,radius)


def select_circle_by_largest_radius(image, detected_circles):
    x, y, radius = (-1,-1,-1)
    
    #checks for circles then finds biggest circle with HoughCircle parameters
    if detected_circles is not None:
        detection_circles = np.uint16(np.around(detected_circles))
        for (xc, yc, rc) in detection_circles[0, :]:
            if(rc > radius):
                x = int(xc)
                y = int(yc)
                radius = int(rc)
    
    return (x,y,radius)




def detect_moon(imagePath:Union[str, Path]) -> tuple:
    'return: (circle_center_x, circle_center_y, circle_radius)'
    
    imagePath = Path(imagePath)
    original_img = cv2.imread(str(imagePath), cv2.IMREAD_COLOR)
    
    # we need to keep the aspect ratio
    # so we can rescale the output x/y coordinate back to match original image
    ret_ratio, img = ResizeWithAspectRatio(deepcopy(original_img), longer_side_val=500)
    
    #creating gray scale version of image needed for HoughCircles
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # set img to maximum contrast
    # only leave black & white pixels
    # usually, moon will be white after this conversion
    gray = apply_brightness_contrast(gray, contrast=127)
    
    #getting height and width of image
    height = img.shape[0]
    width = img.shape[1]
    longer_side_name = None
    if height >= width:
        longer_side_name = 'height'
        longer_side = height
        shorter_side = width
    else:
        longer_side_name = 'width'
        longer_side = width
        shorter_side = height
    
    img_brightness_perc = calc_img_brightness_perc(gray, width, height)
    
    
    # calculation loop
    
    # setup
    x, y, radius = 0, 0, 0
    MAX_ITERATION = 3
    
    dp = 2 ** 4
    minDist = 50
    if minDist > (shorter_side/2):
        minDist = (shorter_side/2)
    minRadRatio = 0.4
    minRadius = longer_side * minRadRatio
    maxRadRatio = 0.6
    maxRadius = longer_side * maxRadRatio
    param1 = 20 * 2
    param2 = 3 * param1
    
    find_circles_in_img_kwargs = {
    'dp':dp,
    'minDist':minDist,
    'minRadius':minRadius,
    'maxRadius':maxRadius,
    'param1':param1,
    'param2':param2,
    }
    
    result_list = []
    
    # process image in each iteration
    for iteration in range(MAX_ITERATION):
        # current iteration img info
        im_height = gray.shape[0]
        im_width = gray.shape[1]
        
        if im_height >= im_width:
            im_longer_side = im_height
        else:
            im_longer_side = im_width
        
        # adjust parameter for find_circles_in_img()
        args = {
            'dp': dp,
            'minDist': minDist,
            'minRadius': im_longer_side * minRadRatio,
            'maxRadius': im_longer_side * maxRadRatio,
            'param1': param1,
            'param2': param2,
        }
        
        img_brightness_perc = calc_img_brightness_perc(gray, im_width, im_height)
        
        if img_brightness_perc < 0.01:
            find_circles_in_img_kwargs['dp'] *= 4
            find_circles_in_img_kwargs['minRadius'] /= 2
        
        detected_circles = find_circles_in_img(gray, **args)
        
        # select a circle thats most likely contains the moon
        
        if iteration == 0:
            x,y,radius = select_circle_by_largest_radius(gray, detected_circles)
        
        elif iteration > 0:
            x,y,radius = select_circle_by_brightness_perc(gray, detected_circles)
        
        # cannot select circle, (select circle function failed)
        # maybe we didn't find any circle
        # use the center of image as the new circle
        if x < 0 or y < 0 or radius < 0:
            x,y,radius = (int(gray.shape[1]/2), int(gray.shape[0]/2), int(gray.shape[1]/2)+3)
        
        # cut out part of img from circle
        gray,rect = cut_image_from_circle(gray, im_height, im_width, x, y, radius, padding=5)
        result_list.append( (iteration, (x,y,radius), rect) )
    
    
    # re-map final circle from a small part of image back to original image
    final_circle_x, final_circle_x, final_circle_radius = -1,-1,-1
    last_rect = (0, 0, 0, 0)
    for iteration,(loc_x,loc_y,loc_radius),rect in result_list:
        if iteration == 0:
            final_circle_x = loc_x
            final_circle_y = loc_y
            final_circle_radius = loc_radius
        else:
            final_circle_x = loc_x - rect[0]
            final_circle_y = loc_y - rect[1]
            final_circle_radius = loc_radius
        final_circle_x += last_rect[0]
        final_circle_y += last_rect[1]
        last_rect = [l+r for l,r in zip(last_rect,rect)]
    
    if longer_side_name == 'height':
        final_circle_x = final_circle_x / ret_ratio
        final_circle_y = final_circle_y / ret_ratio
    else:
        final_circle_x = final_circle_x / ret_ratio
        final_circle_y = final_circle_y / ret_ratio
    final_circle_radius = final_circle_radius / ret_ratio
    
    
    return (int(final_circle_x), int(final_circle_y), int(final_circle_radius))



