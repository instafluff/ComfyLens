const Web = require( "webwebweb" );
Web.APIs[ "/hello" ] = ( qs, body, opts ) => {
	return { data: "hello world", qs };
}
let server = Web.Run( 52220 );
console.log( server );
