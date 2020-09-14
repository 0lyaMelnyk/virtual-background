import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  public videoTag;
  public canvasTag;
  public net;
  bodyPixConfig: any = {
    architechture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 1,
    quantBytes: 4,
  };
  segmentationConfig = {
    internalResolution: 'high',
    segmentationThreshold: 0.05,
    scoreThreshold: 0.05,
    cropSize: [200, 200],
  };
  constructor() {
    this.net = null;
    this.drawBody = this.drawBody.bind(this);
    this.detectBody = this.detectBody.bind(this);
  }
  ngAfterViewInit(): void {
    console.log(tf.version);
    console.log(bodyPix.version);
    this.videoTag = document.querySelector('video');
    this.canvasTag = document.querySelector('canvas');
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.videoTag.srcObject = stream;
        if (this.net == null) {
          bodyPix
            .load({
              architecture: 'MobileNetV1',
              outputStride: 16,
              multiplier: 0.75,
              quantBytes: 2,
            })
            .catch((error) => {
              console.log(error);
            })
            .then(async (objNet) => {
              {
                this.net = objNet;
                await this.detectBody();
              }
            });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  async detectBody(): Promise<void> {
    if (this.net) {
      const personsegmentation = await this.net.segmentPerson(this.videoTag, {
        flipHorizontal: true,
        internalResolution: 'low',
        segmentationThreshold: 0.3,
      });

      if (personsegmentation) {
        this.drawBody(personsegmentation);
      }
    }
    requestAnimationFrame(this.detectBody);
  }
  drawBody(personSegmentation): void {
    this.canvasTag
      .getContext('2d')
      .drawImage(
        this.videoTag,
        0,
        0,
        this.videoTag.height,
        this.videoTag.width
      );
    const imageData = this.canvasTag
      .getContext('2d')
      .getImageData(0, 0, this.canvasTag.height, this.canvasTag.width);
    const pixel = imageData.data;
    for (let p = 0; p < pixel.length; p += 4) {
      if (personSegmentation.data[p / 4] === 0) {
        pixel[p + 3] = 0;
      }
    }
    this.canvasTag.getContext('2d').imageSmoothingEnabled = true;
    this.canvasTag.getContext('2d').putImageData(imageData, 0, 0);
  }
}
