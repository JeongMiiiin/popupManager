function checkMobileSize(){
    if( $(window).width() >= 992 ){
        return false;
    }else{
        return true;
    }
}


popupManager = {

    closePopCallback : {}
    ,zIndex : 9999
    ,isLock : false
    ,isRowFullSize : false
    ,isColumnFullSize : false
    ,isMobile : false
    ,popGarbegeList : {}
    ,popList : []

    ,popBgClickEvent : function(el){
        let _this = this;
        
        //페이지를 막는 팝업일 때
        let pageAccessBlock = false;
        if( $(el).is("[data-popup-page-access-block]") ) pageAccessBlock = true; 
        
        if( !(_this.isMobile) ){
        	$(el).on('dragend',function(e){
            	e.stopPropagation();
            });
        	
        	let checker = $._data($(el)[0], "events");
        	
        	//기존에 removePopup이벤트가 등록되어있는지 확인 (중복 이벤트 적용을 방지)
            if( !checker.click && !pageAccessBlock ){
            	$(el).on('click', function(){
                    _this.removePopLatest(true);
                });
            }

        } else {
        	
        	if( !pageAccessBlock ){
        		$(el).on('click', function(){
                    _this.removePopLatest(true);
                });
        	}

        }
        
        $(el).find('.popup_inner').on('click', function(e){
        	e.stopPropagation();
        });
        
    }

    // isSaveEvent: 이벤트를 남겨야할 경우
    ,removePopLatest : function( isSaveEvent ){
        if( this.popList.length > 0 ) this.removePop( this.popList[this.popList.length-1], isSaveEvent );

        if( this.popList.length == 0 ){
            this.unlockScroll();
        }
    }

    ,getPopLatest : function(){
        if( this.popList.length > 0 ) return this.popList[this.popList.length-1];
        else return null;
    }

    ,checkContentsFullSize : function(el){
        let _this = this;
        let contentsCon = $(el).find('.popup_con');
        let contents = $( contentsCon ).find('.popup_inner');


        //실제 컨텐츠가 넘치는지 체크 (가로는 display : table-cell로 인해서 max-width를 무시하기 때문에 필요, 세로는 넘쳤을 때 header 부분을 fixed로 해야하기 때문에 필요)
        if( $(contentsCon).css('maxWidth').replace('px','') <= $( window ).width() ){
            // 가로로 꽉차지 않았을 때
            _this.isRowFullSize = false;
        } else {
            // 가로로 꽉찼을 때
            _this.isRowFullSize = true;
        }

        if ($( el ).innerHeight() >= $(contentsCon).innerHeight() + 100 ) {
            // 세로로 넘치지 않았을 때
            _this.isColumnFullSize = false;
        } else {
            // 세로로 넘쳤을 때
            _this.isColumnFullSize = true;
        }

    }

    ,positioning : function(el){
        let _this = this;
        let contentsCon = $(el).find('.popup_con');
        let contents = $( contentsCon ).find('.popup_inner');

        if( _this.isRowFullSize ) {
            //가로로 꽉찬 경우
            contents.css('maxWidth', $( window ).width() );

        } else {
            //가로로 꽉차지 않은 경우
            contents.css('maxWidth', '' );
        }

    }

    ,repositioning : function( el ){
        let _this = this;

        _this.positioning( $(el), false);

        $(window).on('resize',function(){
            _this.isMobile = checkMobileSize();
            _this.checkContentsFullSize(el);
            _this.positioning( $(el), false);

        })
    }

    // 팝업을 추가하기 위해 무조건 이 function 을 타야함.
    ,add : function( el, closeCallbackFn ){
        let _this = this;

        if( Object.prototype.toString.call( el ) == '[object String]' ){ // selecter
            let elSelectResult = $(el);
            if( elSelectResult.length == 0 ){
                el = this.popGarbegeList[ el ];
            }else{
                this.popGarbegeList[ el ] = $(el)[0];
                el = this.popGarbegeList[ el ];
            }
        }else if( el.length && el.context ){ // jquery element
            this.popGarbegeList[ el.selector ] = el[0];
            el = this.popGarbegeList[ el.selector ];
        }else{ // jquery element but no element
            if( el.selector && this.popGarbegeList[ el.selector ] ){
                el = this.popGarbegeList[ el.selector ];
            }else{
                this.popGarbegeList[ el ] = el;
            }
        }
        
        let popId = '#' + $( el ).attr('id');
        let url = String(window.location.href).substring(String(window.location.href).indexOf('/'), String(window.location.href).length);
        
        if(url.indexOf('?') > -1){
			popId = "&depth" + (this.popList.length + 1) + "Popup=" + popId;
		} else {
			popId = "?depth" + (this.popList.length + 1) + "Popup=" + popId;	
		}
		history.pushState(null,null, url + popId);
		
		window.onpopstate = function(){
			_this.removePopLatest(true);
		}

        this.popList.push( el );
        this.closePopCallback[el] = closeCallbackFn;

        if( $(el).parent().length == 0 ){
            $(el).hide();
            $(document.body).append( el );
        }

        $(el).show();


        _this.checkContentsFullSize(el);

        _this.isMobile = checkMobileSize() ? true : false;

        this.popBgClickEvent( el );
        
        $(el).css( { 'zIndex' : ( this.zIndex + this.popList.length*3 + 1 ), 'position':'fixed', 'top':0, 'left':0 });


        $(document.body).append( el );

        if($(document.body).attr('data-wv-agent') != 'ie' && $(el).find('.popup_header_con > .popup_close_btn_wrap').length > 0 && $(el).find('.popup_inner > .popup_close_btn_wrap').length == 0){
            let closeBtn = $(el).find('.popup_header_con > .popup_close_btn_wrap');
            $(el).find('.popup_inner').prepend(closeBtn);
        }

        _this.repositioning($(el),false);

        _this.lockScroll();

        return el;
    }

    // isSaveEvent: 이벤트를 남겨야할 경우
    ,removePop : function( el, isSaveEvent ){

        if( this.closePopCallback[el] ){
            this.closePopCallback[el]( { target : el });
            delete this.closePopCallback[el];
        }

        if( Object.prototype.toString.call( el ) == '[object String]' ){
            el = $(el)[0];
        }else if( el.length && el.context ){
            el = el[0];
        }

        this.popList.splice( this.popList.indexOf( el ), 1 );

        /*this.offScrollEvent( el );*/


        if( el.parentNode ){
            if( !isSaveEvent ) {
                $(el).remove();
            } else {
                $(el).detach();
            }
        }

        if( this.popList.length == 0 ){
            this.unlockScroll();
        }
        
        return el;
    }

    //열려있는 Popup을 모두 제거
    ,removePopAll : function( isSaveEvent ){

        let _this = this;

        if( this.popList.length > 0 ){

            for( let i = this.popList.length - 1; i > -1; i-- ){

                this.removePop( this.popList[i], isSaveEvent );
            }

        }


        if( this.popList.length == 0 ){
            this.unlockScroll();
        }
    }

    ,lockScroll : function() {
        if (this.isLock) return;
        
        $html = $('html');
        $body = $('body');
        let initWidth = $body.outerWidth();
        let initHeight = $body.outerHeight();

        let scrollPosition = [
            self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
            self.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop
        ];
        $html.data('scroll-position', scrollPosition);
        $html.data('previous-overflow', $html.css('overflow'));
        $html.css('overflow', 'hidden');
        window.scrollTo(scrollPosition[0], scrollPosition[1]);
        
        let marginR = $body.outerWidth()-initWidth;
        let marginB = $body.outerHeight()-initHeight;
        $body.css({'margin-right': marginR,'margin-bottom': marginB});
        
        $body.css('overflow', 'hidden');
        
        this.isLock = true;
    }

    ,unlockScroll: function() {
        if (!this.isLock) return;
        $html = $('html');
        $body = $('body');
        $html.css('overflow', $html.data('previous-overflow'));
        let scrollPosition = $html.data('scroll-position');
        window.scrollTo(scrollPosition[0], scrollPosition[1]);

        $body.css({'margin-right': 0, 'margin-bottom': 0});
        
        $body.css('overflow', '');
        this.isLock = false;
    }

};