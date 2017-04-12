/* eslint no-undef: 0 */
import React, { Component } from 'react';
import './App.css';
import '../node_modules/tracking/build/tracking-min';
import '../node_modules/tracking/build/data/face';
import Webcam from 'webcamjs';
import resemble from 'resemblejs';

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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pic: '',
      resultPic: '',
      match: 0,
      name: 'Your name',
    };
  }
  componentDidMount() {
    const tracker = new tracking.ObjectTracker('face');

    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    tracking.track('#video', tracker, { camera: true });

    tracker.on('track', this.track.bind(this));

    Webcam.attach('#video');
  }

  track(event) {
    if (event.data.length >= 1) {
      if (this.state.pic !== '') {
        debounce(this.doMatch(), 2000);
      }
    };
  }

  takeSnapshot(callback) {
    if (this.state.name !== '') {
      Webcam.snap(callback);
    }
  }

  addImageToCanvas(canvasId, dataUri, x, y, width, height) {
    return new Promise((resolve, reject) => {
      const canvasHidden = document.getElementById(canvasId);
      const context = canvasHidden.getContext('2d');
      const image = new Image();
      image.addEventListener('load', () => {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, x, y, canvas.width, canvas.height);
        resolve(true);
      }, false);
      image.src = dataUri;
    });
  }

  snapshot(dataUri) {
    this.setState({
      pic: dataUri,
    });
  }

  doMatch() {
      this.takeSnapshot(this.compareImages.bind(this));
  }

  compareImages(cameraData) {
    const width = 640;
    const height = 480;
    const canvasHidden = document.getElementById('canvashidden');

    this.addImageToCanvas('canvashidden', this.state.pic, 0, 0, width, height).then(() => {
      this.addImageToCanvas('canvashidden', cameraData, width, 0, width, height).then((ret) => {
        const imageElement = document.createElement('img');
        imageElement.src = canvasHidden.toDataURL();
        imageElement.width = width * 2;
        imageElement.height = height;

        const tracker2 = new tracking.ObjectTracker('face');

        tracker2.setInitialScale(4);
        tracker2.setStepSize(2);
        tracker2.setEdgesDensity(0.1);

        tracking.track(imageElement, tracker2);

        tracker2.once('track', (rect) => {
          if (rect.data.length >= 2) {
            const context = canvasHidden.getContext('2d');
            const data1 = rect.data[0];
            const imageData1 = context.getImageData(data1.x, data1.y, data1.width, data1.height);
            const data2 = rect.data[1];
            const imageData2 = context.getImageData(data2.x, data2.y, data2.width, data2.height);

            resemble(imageData1)
            .compareTo(imageData2)
            .ignoreColors()
            .ignoreAntialiasing()
            .scaleToSameSize()
            .onComplete((data) => {
              this.setState({
                resultPic: data.getImageDataUrl(),
                match: 100 - data.misMatchPercentage,
              });
            });
          }
        });
      });
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
            <input type="text" defaultValue={this.state.name} onBlur={(evt) => this.setState({ name: evt.target.value })} />
            <button onClick={() => this.takeSnapshot(this.snapshot.bind(this))}>Snapshot</button>
          </div>

          {this.state.pic !== '' && (
            <div>
              <img src={this.state.pic} alt="Snapshot" />
            </div>
          )}
        </div>

        <canvas id="canvashidden" width="1280" height="480" style={{ display: 'none' }}></canvas>

        {this.state.name && (
          <div className="top-right">
            {this.state.match > 25 ? (
              <p>Hi {this.state.name}! I recognised you ;)</p>
            ) : (
              <p>Who are you? Take a snapshot so I can recognise you!</p>
            )}
            {this.state.resultPic !== '' && (
              <div className="result">
                <p><img src={this.state.resultPic} alt="Result pic" /></p>
                <p>Match: {parseFloat(this.state.match).toFixed(2)}%</p>
              </div>
            )}
            
          </div>
        )}
      </div>
    );
  }
}

export default App;
