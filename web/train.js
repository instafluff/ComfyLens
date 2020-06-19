const CANVAS_SIZE = 224;  // Matches the input size of MobileNet.

// Name prefixes of layers that will be unfrozen during fine-tuning.
const topLayerGroupNames = ['conv_pw_9', 'conv_pw_10', 'conv_pw_11'];

// Name of the layer that will become the top layer of the truncated base.
const topLayerName =
    `${topLayerGroupNames[topLayerGroupNames.length - 1]}_relu`;

// Used to scale the first column (0-1 shape indicator) of `yTrue`
// in order to ensure balanced contributions to the final loss value
// from shape and bounding-box predictions.
const LABEL_MULTIPLIER = [CANVAS_SIZE, 1, 1, 1, 1];

function customLossFunction(yTrue, yPred) {
  return tf.tidy(() => {
    // Scale the the first column (0-1 shape indicator) of `yTrue` in order
    // to ensure balanced contributions to the final loss value
    // from shape and bounding-box predictions.
    return tf.metrics.meanSquaredError(yTrue.mul(LABEL_MULTIPLIER), yPred);
  });
}

async function loadTruncatedBase( mobilenet = null ) {
  // TODO(cais): Add unit test.
  if( mobilenet === null ) {
	  mobilenet = await tf.loadLayersModel(
	      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
  }

  // Return a model that outputs an internal activation.
  const fineTuningLayers = [];
  const topLayer = mobilenet.getLayer(topLayerName);
  const truncatedBase =
      tf.model({inputs: mobilenet.inputs, outputs: topLayer.output});
  // Freeze the model's layers.
  for (const layer of truncatedBase.layers) {
    layer.trainable = false;
    for (const groupName of topLayerGroupNames) {
      if (layer.name.indexOf(groupName) === 0) {
        fineTuningLayers.push(layer);
        break;
      }
    }
  }

  tf.util.assert(
      fineTuningLayers.length > 1,
      `Did not find any layers that match the prefixes ${topLayerGroupNames}`);
  return {truncatedBase, fineTuningLayers};
}

function buildNewHead(inputShape) {
  const newHead = tf.sequential();
  newHead.add(tf.layers.flatten({inputShape}));
  newHead.add(tf.layers.dense({units: 200, activation: 'relu'}));
  newHead.add(tf.layers.dense({units: 128, activation: 'relu'}));
  newHead.add(tf.layers.dense({units: 64, activation: 'relu'}));
  newHead.add(tf.layers.dense({units: 32, activation: 'relu'}));
  newHead.add(tf.layers.dense({units: 16, activation: 'relu'}));
  // Five output units:
  //   - The first is a shape indictor: predicts whether the target
  //     shape is a triangle or a rectangle.
  //   - The remaining four units are for bounding-box prediction:
  //     [left, right, top, bottom] in the unit of pixels.
  newHead.add(tf.layers.dense({units: 5}));
  return newHead;
}

async function buildObjectDetectionModel( prevModel = null ) {
  const {truncatedBase, fineTuningLayers} = await loadTruncatedBase( prevModel );

  let model = prevModel;
  if( prevModel === null ) {
      // Build the new head model.
      // const newHead = buildNewHead(truncatedBase.outputs[0].shape.slice(1));
      // const newOutput = newHead.apply(truncatedBase.outputs[0]);
      // model = tf.model({inputs: truncatedBase.inputs, outputs: newOutput});
	  let mobilenet = await tf.loadLayersModel(
	      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

	  const bottleneck = mobilenet.getLayer( "conv_pw_13_relu" );
		const baseModel = tf.model({
		    inputs: mobilenet.inputs,
		    outputs: bottleneck.output
		});
		// Freeze the convolutional base
		for( const layer of baseModel.layers ) {
		    layer.trainable = false;
		}
		// Add a classification head
		const newHead = tf.sequential();
		// newHead.add( tf.layers.globalAveragePooling2d( {
		//     inputShape: baseModel.outputs[ 0 ].shape.slice( 1 )
		// } ) );
		// newHead.add( tf.layers.globalMaxPooling2d( {
		//     inputShape: baseModel.outputs[ 0 ].shape.slice( 1 )
		// } ) );
		// newHead.add( tf.layers.maxPooling2d( {
		// 	inputShape: baseModel.outputs[ 0 ].shape.slice( 1 ),
		// 	poolSize: [ 2, 2 ],
		// 	strides: [ 2, 2 ]
		// } ) );
		newHead.add( tf.layers.flatten( { inputShape: baseModel.outputs[ 0 ].shape.slice( 1 ) } ) );
		// newHead.add( tf.layers.flatten() );
		newHead.add( tf.layers.dense( { units: 200, activation: "relu" } ) );
		newHead.add( tf.layers.dense( { units: 128, activation: 'relu' } ) );
		newHead.add( tf.layers.dense( { units: 64, activation: 'relu' } ) );
		// newHead.add( tf.layers.dense( { units: 32, activation: 'relu' } ) );
		// newHead.add( tf.layers.dense( { units: 16, activation: 'relu' } ) );
		newHead.add( tf.layers.dense( { units: 5 } ) );
		// newHead.add( tf.layers.dense( { units: 1, activation: "softmax" } ) );
		// Build the new model
		const newOutput = newHead.apply( baseModel.outputs[ 0 ] );
		const newModel = tf.model( { inputs: baseModel.inputs, outputs: newOutput } );
		// newModel.compile( { loss: "meanSquaredError", optimizer: tf.train.rmsprop( 0.0001 ), metrics: [ "acc" ] } );
		// newModel.compile( { loss: "meanSquaredError", optimizer: "adam", metrics: [ "acc" ] } );
		// newModel.summary();
		model = newModel;
  }
  // else {
	//   // Freeze the model's layers.
	//   for (const layer of model.layers) {
	//     layer.trainable = false;
	//   }
  // }

  return {model, fineTuningLayers};
}
