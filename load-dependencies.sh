#!/usr/bin/env bash

cd `dirname "${0}"`
defaultPath=`pwd`
load()
{
	local PATH_JSLIB="libs/js"
	local PATH_CSSLIB="libs/css"
	local PATH_FONTS="fonts"

	local JQUERY_FILENAME="jquery-2.1.0.min.js"
	if [ ! -f $PATH_JSLIB/$JQUERY_FILENAME ]; then
		echo "Downloading jQuery..."
		mkdir -p $PATH_JSLIB
		curl -o $PATH_JSLIB/${JQUERY_FILENAME} -L http://code.jquery.com/${JQUERY_FILENAME}
	fi

	if [ ! -f $PATH_JSLIB/bootstrap.min.js ]; then
		local BS_FN="bootstrap-3.1.1-dist"
		echo "Downloading Twitter Bootstrap..."
		curl -O -L https://github.com/twbs/bootstrap/releases/download/v3.1.1/$BS_FN.zip
		unzip $BS_FN.zip
		rm $BS_FN.zip
		mv $BS_FN/js/*.min.js $PATH_JSLIB
		mkdir -p $PATH_CSSLIB
		mv $BS_FN/css/*.min.css $PATH_CSSLIB
		mkdir -p $PATH_FONTS
		mv $BS_FN/fonts/* $PATH_FONTS
		rm -r $BS_FN
	fi

	local SPIN_JS_FILENAME="spin.min.js"
	if [ ! -f $PATH_JSLIB/$SPIN_JS_FILENAME ]; then
		echo "Downloading spin.js..."
		mkdir -p $PATH_JSLIB
		curl -o $PATH_JSLIB/${SPIN_JS_FILENAME} -L http://fgnass.github.io/spin.js/${SPIN_JS_FILENAME}
	fi

	local TYPEAHEAD_JS_FILENAME="typeahead.bundle.min.js"
	if [ ! -f $PATH_JSLIB/$TYPEAHEAD_JS_FILENAME ]; then
		echo "Downloading typeahead.js..."
		mkdir -p $PATH_JSLIB
		curl -o $PATH_JSLIB/${TYPEAHEAD_JS_FILENAME} -L http://twitter.github.com/typeahead.js/releases/latest/${TYPEAHEAD_JS_FILENAME}
	fi

	echo "Done!"
}

# load depenencies
cd $defaultPath
cd public
load

# init meetup.js
cd $defaultPath
pwd
cd meetup.js/
git submodule update --init
npm i
cd SimpleWebRTC/ && npm i && cd ../
cd signalmaster/ && npm i && cd ../
grunt release
cp -R release ../public/libs/meetup.js


