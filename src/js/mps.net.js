
Mps.net = (function() {

    return {
        reqSendMarkerImage: function(url) {
            //var fd = new FormData(document.forms[0]);
            var fd = new FormData();
            var blob = this.dataUriToBlob(url);
            fd.append("image", blob);
            var $ajax = $.ajax({
                url: "/image",
                type: "POST",
                data: fd,
                processData: false,  // jQuery がデータを処理しないよう指定
                contentType: false   // jQuery が contentType を設定しないよう指定
            });

            return $ajax;
        },

        /**
         * @see http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
         */
        dataUriToBlob: function(dataURI) {
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs
            var byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            var array = [];
            for(var i = 0; i < byteString.length; i++) {
                array.push(byteString.charCodeAt(i));
            }
            return new Blob([new Uint8Array(array)], {
                type: mimeString
            });
        }
    };
})();
