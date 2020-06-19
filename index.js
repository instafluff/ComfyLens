const fs = require( "fs" );
const bsplit = require( "buffer-split" );

let sampleImages = JSON.parse( fs.readFileSync( "web/sample.json" ).toString() );

const Web = require( "webwebweb" );
Web.APIs[ "/hello" ] = ( qs, body, opts ) => {
	return { data: "hello world", qs };
};

Web.APIs[ "samples" ] = () => {
	return sampleImages;
}

Web.APIs[ "untagged" ] = () => {
	let imageDir = fs.readdirSync( "web/sample" );
	let untagged = imageDir.filter( f => !sampleImages.some( s => s.image === f ) );
	return untagged;
}

Web.APIs[ "all" ] = () => {
	let imageDir = fs.readdirSync( "web/sample" );
	return imageDir;
}

Web.APIs[ "savemodel" ] = async ( qs, body, opts ) => {
	let boundary = "--" + opts.req.headers[ "content-type" ].split( " " )[ 1 ].split( "=" )[ 1 ];
	let contentLength = parseInt( opts.req.headers[ "content-length" ] );
	let parts = bsplit( body, Buffer.from( boundary ) );
	let modelJson = parts[ 1 ].toString().split( "\r\n" ).slice( 4 ).join( "\r\n" );
	fs.writeFileSync( "web/models/model.json", modelJson );
	let modelWeightsHeader = parts[ 2 ].toString().split( "\r\n" ).slice( 0, 4 ).join( "\r\n" ) + "\r\n";
	modelWeights = bsplit( parts[ 2 ], Buffer.from( modelWeightsHeader ) )[ 1 ];
	fs.writeFileSync( "web/models/model.weights.bin", modelWeights );
	return {};
};

Web.APIs[ "/getimage" ] = ( qs, body, opts ) => {
	let imageDir = fs.readdirSync( "web/sample" );
	let untagged = imageDir;//.filter( f => !sampleImages.some( s => s.image === f ) );
	if( untagged.length > 0 ) {
		return untagged[ Math.floor( untagged.length * Math.random() ) ];
	}
	return "";
};
Web.APIs[ "/tagimage" ] = ( qs, body, opts ) => {
	body = JSON.parse( body );
	console.log( body );
	sampleImages = sampleImages.filter( x => x.image !== body.image );
	sampleImages.push( body );
	fs.writeFileSync( "web/sample.json", JSON.stringify( sampleImages, null, 4 ) );
	return sampleImages;
};
let server = Web.Run( 52220 );
// console.log( server );
