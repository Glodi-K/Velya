//const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const path = require('path');
const fs = require('fs');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function loadModels() {
  const modelPath = path.join(__dirname, '../models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
}

async function loadImage(imagePath) {
  return await canvas.loadImage(imagePath);
}

async function compareFaces(referencePath, selfiePath) {
  await loadModels();

  const referenceImage = await loadImage(referencePath);
  const selfieImage = await loadImage(selfiePath);

  const referenceDetection = await faceapi
    .detectSingleFace(referenceImage)
    .withFaceLandmarks()
    .withFaceDescriptor();

  const selfieDetection = await faceapi
    .detectSingleFace(selfieImage)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!referenceDetection || !selfieDetection) {
    return { success: false, message: 'Visage non détecté.' };
  }

  const distance = faceapi.euclideanDistance(
    referenceDetection.descriptor,
    selfieDetection.descriptor
  );

  return {
    success: distance < 0.6, // seuil à adapter si besoin
    distance,
  };
}

module.exports = compareFaces;

