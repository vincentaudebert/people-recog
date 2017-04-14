/* eslint no-undef: 0 */
import React, { Component } from 'react';
import './App.css';
import '../node_modules/tracking/build/tracking-min';
import '../node_modules/tracking/build/data/face';
import Webcam from 'webcamjs';
import resemble from 'resemblejs';
import Modal from 'react-modal';

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
      name: '',
      openModal: false,
      nameSaved: false,
      noFace: true,
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
      if (this.state.pic !== '' && this.state.nameSaved) {
        debounce(this.doMatch(), 2000);
      }
      this.setState({
        noFace: false,
      });
    } else {
      this.setState({
        noFace: true,
      });
    };
  }

  takeSnapshot(callback) {
    Webcam.snap(callback);
  }

  afterOpenModal() {
    this.setState({
      nameSaved: false,
    });
  }

  openModal(callback) {
    this.setState({
      openModal: true,
    });
    this.takeSnapshot(callback);
  }

  closeModal() {
    this.setState({
      openModal: false,
      nameSaved: true,
    });
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
            <button 
              onClick={() => this.openModal(this.snapshot.bind(this)).bind(this)}
              disabled={this.state.noFace}
              className="button"
            >
              Snapshot
            </button>
          </div>

          <Modal
            isOpen={this.state.openModal}
            onAfterOpen={this.afterOpenModal.bind(this)}
            onRequestClose={this.closeModal.bind(this)}
            contentLabel="Modal"
            className="modal__content"
            overlayClassName="modal__overlay"
          >
            <div>
              {this.state.pic !== '' && (
                <div>
                  <img className="snapshot__img" src={this.state.pic} alt="Snapshot" />
                </div>
              )}
              <div>
                <label className="label" htmlFor="input-name">
                  May I ask your name?
                </label>
              </div>
              <div>
                <input 
                  id="input-name"
                  className="input"
                  name="name"
                  type="text"
                  placeHolder="Your name"
                  onBlur={(evt) => this.setState({ name: evt.target.value })}
                />
              </div>
              <div>
                <button 
                  onClick={this.closeModal.bind(this)}
                  type="button"
                  className="button"
                >
                  Save
                </button>
              </div>
            </div>
          </Modal>
        </div>

        <canvas id="canvashidden" width="1280" height="480" style={{ display: 'none' }}></canvas>

        <div className="result">
          {this.state.nameSaved ? (
            <div>
              {this.state.match > 25 ? (
                <p>Hi {this.state.name}! I recognised you ;)</p>
              ) : (
                <p>Oh :( I don't know you.</p>
              )}
              {this.state.resultPic !== '' && (
                <div className="result__picture">
                  <p><img src={this.state.resultPic} alt="Result pic" /></p>
                  <p>Match: {parseFloat(this.state.match).toFixed(2)}%</p>
                </div>
              )}
            </div>
          ) : (
            <p>Who are you? Take a snapshot so I can recognise you!</p>
          )}
        </div>
      </div>
    );
  }
}

export default App;
