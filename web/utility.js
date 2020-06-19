function loadImage( url ) {
    return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; })
}

async function DrawImageToCanvas( canvasId, imageUrl, offset = { x: 0, y: 0 }, scale = 1 ) {
    var canvas = document.getElementById( canvasId );
    if( canvas.getContext ) {
        ctx = canvas.getContext('2d');
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        let img = await loadImage( imageUrl );

        var hRatio = canvas.width / img.width;
        var vRatio = canvas.height / img.height;
        var ratio  = Math.min( hRatio, vRatio ) * scale;
        ctx.clearRect( 0, 0, canvas.width, canvas.height );
        ctx.drawImage( img, 0, 0, img.width, img.height, -offset.x * scale, -offset.y * scale, img.width * ratio, img.height * ratio );
    }
}

const TRUE_BOUNDING_BOX_LINE_WIDTH = 2;
const TRUE_BOUNDING_BOX_STYLE = 'rgb(255,0,0)';
const PREDICT_BOUNDING_BOX_LINE_WIDTH = 2;
const PREDICT_BOUNDING_BOX_STYLE = 'rgb(0,0,255)';

function drawBoundingBoxesWidthHeight( canvas, trueBoundingBox, predictBoundingBox ) {
	let trueBox = [ trueBoundingBox[ 0 ], trueBoundingBox[ 0 ] + trueBoundingBox[ 1 ], trueBoundingBox[ 2 ], trueBoundingBox[ 2 ] + trueBoundingBox[ 3 ] ];
	let predBox = [ predictBoundingBox[ 0 ], predictBoundingBox[ 0 ] + predictBoundingBox[ 1 ], predictBoundingBox[ 2 ], predictBoundingBox[ 2 ] + predictBoundingBox[ 3 ] ];
	drawBoundingBoxes( canvas, trueBox, predBox );
}

function drawBoundingBoxes(canvas, trueBoundingBox, predictBoundingBox) {
  // tf.util.assert(
  //     trueBoundingBox != null && trueBoundingBox.length === 4,
  //     `Expected boundingBoxArray to have length 4, ` +
  //         `but got ${trueBoundingBox} instead`);
  // tf.util.assert(
  //     predictBoundingBox != null && predictBoundingBox.length === 4,
  //     `Expected boundingBoxArray to have length 4, ` +
  //         `but got ${trueBoundingBox} instead`);

  let left = trueBoundingBox[0];
  let right = trueBoundingBox[1];
  let top = trueBoundingBox[2];
  let bottom = trueBoundingBox[3];

  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.strokeStyle = TRUE_BOUNDING_BOX_STYLE;
  ctx.lineWidth = TRUE_BOUNDING_BOX_LINE_WIDTH;
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.lineTo(left, top);
  ctx.stroke();

  ctx.font = '15px Arial';
  ctx.fillStyle = TRUE_BOUNDING_BOX_STYLE;
  ctx.fillText('true', left, top);

  left = predictBoundingBox[0];
  right = predictBoundingBox[1];
  top = predictBoundingBox[2];
  bottom = predictBoundingBox[3];

  ctx.beginPath();
  ctx.strokeStyle = PREDICT_BOUNDING_BOX_STYLE;
  ctx.lineWidth = PREDICT_BOUNDING_BOX_LINE_WIDTH;
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.lineTo(left, top);
  ctx.stroke();

  ctx.font = '15px Arial';
  ctx.fillStyle = PREDICT_BOUNDING_BOX_STYLE;
  ctx.fillText('predicted', left, bottom);
}
