/* eslint no-undef: 0 */

import React, { Component } from 'react';
import './App.css';
import '../node_modules/tracking/build/tracking-min';
import '../node_modules/tracking/build/data/face';
import dat from '../node_modules/dat.gui/build/dat.gui.min';
import Webcam from 'webcamjs';

const debounce = (func, wait, immediate) => {
	let timeout;
	return function() {
		const context = this, args = arguments;
		const later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

const convertURIToImageData = (URI) => {
  return new Promise((resolve, reject) => {
    if (URI == null) return reject();
    const canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        image = new Image();
    image.addEventListener('load', () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    }, false);
    image.src = URI;
  });
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pic: '',
    };
  }
  componentDidMount() {
    const tracker = new tracking.ObjectTracker('face');

    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    tracking.track('#video', tracker, { camera: true });

    tracker.on('track', this.track.bind(this));

    const gui = new dat.GUI();
    gui.add(tracker, 'edgesDensity', 0.1, 0.5).step(0.01);
    gui.add(tracker, 'initialScale', 1.0, 10.0).step(0.1);
    gui.add(tracker, 'stepSize', 1, 5).step(0.1);

    Webcam.attach('#video');
  }

  track(event) {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    event.data.forEach(() => {
      if (this.state.pic !== '') {
        debounce(this.doMatch(), 2000);
      }
    });
  }

  takeSnapshot(callback) {
    Webcam.snap(callback);
  }

  snapshot(dataUri) {
    convertURIToImageData(dataUri).then((imageData) => {
      this.setState({
        pic: imageData,
        picDataUri: dataUri,
      });
    });
    
  }

  doMatch() {
      this.takeSnapshot(this.compareImages.bind(this));
  }

  compareImages(cameraData) {
    const width = 640;
    const height = 480;
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    convertURIToImageData(cameraData).then((imageData) => {
      const canvasHidden = document.getElementById('canvas-hidden');
      const contextHidden = canvas.getContext('2d');

      contextHidden.drawImage(this.state.pic, 0, 0, width, height);
      contextHidden.drawImage(imageData, width, 0, width, height);

      const tracker2 = new tracking.ObjectTracker('face');

      tracker2.setInitialScale(4);
      tracker2.setStepSize(2);
      tracker2.setEdgesDensity(0.1);

      tracking.track('#canvas-hidden', tracker2);

      tracker2.on('track', (rect) => {
        console.log(rect);
      });
    
    //   const imageData1 = this.state.pic;
    //   const imageData2 = imageData;

    //   tracking.Brief.N = window.descriptorLength;

    //   const gray1 = tracking.Image.grayscale(tracking.Image.blur(imageData1.data, width, height, blurRadius), width, height);
    //   const gray2 = tracking.Image.grayscale(tracking.Image.blur(imageData2.data, width, height, blurRadius), width, height);

    //   const corners1 = tracking.Fast.findCorners(gray1, width, height);
    //   const corners2 = tracking.Fast.findCorners(gray2, width, height);

    //   const descriptors1 = tracking.Brief.getDescriptors(gray1, width, corners1);
    //   const descriptors2 = tracking.Brief.getDescriptors(gray2, width, corners2);

    //   const matches = tracking.Brief.reciprocalMatch(corners1, descriptors1, corners2, descriptors2);
    //   matches.sort((a, b) => {
    //     return b.confidence - a.confidence;
    //   });

    //   console.log(matches.length);

    //   // console.log(matches);

    //   for (var i = 0; i < Math.min(window.matchesShown, matches.length); i++) {
    //     const color = '#' + Math.floor(Math.random()*16777215).toString(16);
    //     // console.log(context);
    //     context.fillStyle = color;
    //     context.fillRect(matches[i].keypoint1[0], matches[i].keypoint1[1], 4, 4);
    //     context.fillRect(matches[i].keypoint2[0] + width, matches[i].keypoint2[1], 4, 4);
    //   }
    });
    
  }

  render() {
    return (
      <div className="App">
        <div className="demo-frame">
          <div className="demo-container">
            <video id="video" width="640" height="480" preload autoPlay loop muted></video>
            <canvas id="canvas" width="640" height="480"></canvas>
          </div>
        </div>

        <div className="snapshot">
          <div>
            <button onClick={() => this.takeSnapshot(this.snapshot.bind(this))}>Snapshot</button>
          </div>

          {this.state.pic !== '' && (
            <div>
              <img src={this.state.picDataUri} alt="Snapshot" />
            </div>
          )}
        </div>

        <canvas id="canvas" width="1280" height="480" style={{ display: 'none' }}></canvas>
      </div>
    );
  }
}

export default App;
