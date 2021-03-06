var VerticalFog = function(){
	var container, stats;

	var camera, scene, renderer, controls, uniforms, _mainobj;

	var mouseX = 0, mouseY = 0;

	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;
	var depthFbo, materialDepth, composeFbo;
	var cameraNear=1.0, cameraFar = 50.0;
	var composeCamera, composeScene ,composeUniforms;
	var isRun = true;
	var timeNUM=0;

	this.init= function(){

		container = document.createElement( 'div' );
		document.body.appendChild( container );

		camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, cameraNear, cameraFar );
		camera.position.set( 0, 3, 16 );

		// scene

		scene = new THREE.Scene();
		var axes = new THREE.AxesHelper( 10);
        // scene.add(axes);

		var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
		scene.add( ambientLight );

		var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
		camera.add( pointLight );
		scene.add( camera );
        
        light = new THREE.HemisphereLight( 0xbbbbff, 0x444422 );
		light.position.set( 0, 1, 0 );
		
		var loader = new THREE.GLTFLoader();
		loader.load( 'opera_apple_store/scene.gltf', function ( gltf ) {

			// gltf.scene.traverse( function ( child ) {

			// 	if ( child.isMesh ) {

			// 		child.material.envMap = envMap;

			// 	}

			// } );
			selObj = gltf.scene.children;
            gltf.scene.position.y = -3.5;
			scene.add( gltf.scene );

		} );
		uniforms = {
			cameraNear: {
				type: "f",
				value: cameraNear
			},
			cameraFar: {
				type: "f",
				value: cameraFar
			},
	    };
	    var  ShaderMaterial = new THREE.ShaderMaterial({
	        uniforms: uniforms,
	        vertexShader: document.getElementById('depth-vert').textContent,
	        fragmentShader: document.getElementById('depth-frag').textContent
	    });
		materialDepth = ShaderMaterial;
		// materialDepth = new THREE.MeshDepthMaterial( );
		var renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
		depthFbo = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, renderTargetParameters );

        var renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
		composeFbo = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, renderTargetParameters );
		composeCamera = new THREE.OrthographicCamera(-windowHalfX, windowHalfX, windowHalfY, -windowHalfY, -10, 10);
		composeScene = new THREE.Scene();
		var composePlaneGeometry = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);//最终效果渲染平面
		composeUniforms = {
	        uResolution: {
				type :"v2",
	            value: new THREE.Vector2(window.innerWidth, window.innerHeight)
	        },
			depthtexture: {
				value: depthFbo.texture,
			},
			texture: {
				value: composeFbo.texture,
			},
			noiseTexture:   {
				value: new THREE.TextureLoader().load( 'css/noise1.png' ),
			},
			time: {
				type: "f",
				value: 0.0
			},
			fogColor:{
				type :"v3",
				value: new THREE.Vector3(1,1,1),
			},
		    depthMax:{
				type: "f",
				value: 2.1,
			},
			depthMin:{
				type: "f",
				value: 0.3,
			},
			_fogDensity:{
				type: "f",
				value: 1.0,
			},
			noiseAmount:{
				type: "f",
				value: 1.0,
			},
	    };
	    var  composeShaderMaterial = new THREE.ShaderMaterial({
	        uniforms: composeUniforms,
	        vertexShader: document.getElementById('compose-vert').textContent,
	        fragmentShader: document.getElementById('compose-frag').textContent
	    });
		var composeMaterial = new THREE.MeshBasicMaterial({
	        map: depthFbo.texture
	    });
		composePlaneMesh = new THREE.Mesh(composePlaneGeometry, composeShaderMaterial);
		composeScene.add(composePlaneMesh);

		//

		renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( renderer.domElement );
		controls = new THREE.OrbitControls(camera,renderer.domElement);
		controls.minPolarAngle = THREE.Math.degToRad(70);
	    controls.maxPolarAngle = THREE.Math.degToRad(89);

		document.addEventListener( 'mousemove', onDocumentMouseMove, false );

		//

		window.addEventListener( 'resize', onWindowResize, false );
		// this.load_Fence()
		animate();

	}

    function onProgress( xhr ) {

		if ( xhr.lengthComputable ) {

			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

		}

	};

    function onError( xhr ) { consoel.log(xhr) };

	function onWindowResize() {

		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

	function onDocumentMouseMove( event ) {

		mouseX = ( event.clientX - windowHalfX ) / 2;
		mouseY = ( event.clientY - windowHalfY ) / 2;

	}

	//

	function animate() {
        controls.update();
		requestAnimationFrame( animate );
		render();

	}

	function render() {
		if(isRun){
			var time = timeNUM++;
			// var time = ( 1 + Math.sin( 2 * clock.getElapsedTime() / Math.PI ) ) / 2;//t取值：0-1
			time = Math.sin(( time % 1000 ) / 1000*Math.PI*2);//限制在0-1-0范围
			composeUniforms.time.value = time ;
		}
		scene.overrideMaterial = materialDepth;
		renderer.render( scene, camera, depthFbo, true );//使用指定材质渲染场景到帧缓存 得到场景中的物体关于世界坐标y轴的贴图
		scene.overrideMaterial = null;//正常绘制
		// renderer.render( scene, camera );
		renderer.render( scene, camera, composeFbo, true );//正常渲染场景中的物体到帧缓存
	    scene.overrideMaterial = null;
		// renderer.render( scene, camera );
		renderer.render( composeScene, composeCamera );

	}

	this.addGui = function(){
    	var scope = this;
		var API = {
			        '开启云雾飘动'    	: true,
					'雾化颜色'    	: [255, 255, 255],
					'深度最大值'    	: 3.6,
					'深度最小值'    	: 0.3,
					'雾的浓度'   : 1.0,
					'noiseAmount'   : 1.0,
				};
		var gui = new dat.GUI();

		gui.add( API, '开启云雾飘动' ).onChange( function(val) {
			    isRun = val;
		} );

		gui.addColor( API, '雾化颜色' ).onChange( function(val) {
			    composeUniforms.fogColor.value.x = composeUniforms.fogColor.value.x = val[0]/255;//转到着色器数值范围[0-1]
			    composeUniforms.fogColor.value.y = composeUniforms.fogColor.value.y = val[1]/255;
			    composeUniforms.fogColor.value.z = composeUniforms.fogColor.value.z = val[2]/255;
		} );

        gui.add( API, '深度最大值', 2.1, 10.0, 0.1 ).onChange( function(val) {
				composeUniforms.depthMax.value = val;
		} );

		gui.add( API, '深度最小值', 0.0, 2, 0.1 ).onChange( function(val) {
				composeUniforms.depthMin.value = val;
		} );

		// gui.add( API, '雾的浓度', 0, 1, 0.1 ).onChange( function(val) {
		// 		composeUniforms._fogDensity.value = val;
		// } );

		// gui.add( API, 'noiseAmount', 0, 1, 0.1 ).onChange( function(val) {
		// 		composeUniforms.noiseAmount.value = val;
		// } );

	}
}
var _VerticalFog = new VerticalFog();
_VerticalFog.init();
_VerticalFog.addGui();

