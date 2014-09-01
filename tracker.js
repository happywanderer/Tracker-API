// GIST: https://gist.github.com/shdwjk/79a60b8d2ee58e87604d

var Tracker = Tracker || (function() {
    'use strict';

    var version = 0.1,

    adjust = function (playerid,attr,amount) {
    	var val = parseInt(attr.get('current'),10)||0,
			max = parseInt(attr.get('max'),10)||10000,
			adj = (val+amount),
			chr = getObj('character',attr.get('characterid')),
			valid = true;

		if(adj < 0 ) {
			sendChat('Tracker', (isGM(playerid) ? '/w gm ' : '')
				+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
					+'<b>'+chr.get('name') + '</b> does not have enough '+attr.get('name')+'.  Needs '+Math.abs(amount)+', but only has '
					+'<span style="color: #ff0000;">'+val+'</span>.'
					+'<span style="font-weight:normal;color:#708090;>&#91;Attribute: '+attr.get('name')+'&#93;</span>'
				+'</div>'
				);
			valid = false;
		} else if( adj > max) {
			sendChat('Tracker', (isGM(playerid) ? '/w gm ' : '')
				+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
					+'<b>'+chr.get('name') + '</b> does not have enough storage space for '+attr.get('name')+'.  Needs '+adj+', but only has '
					+'<span style="color: #ff0000;">'+max+'</span>.'
					+'<span style="font-weight:normal;color:#708090;>&#91;Attribute: '+attr.get('name')+'&#93;</span>'
				+'</div>'
				);
			valid = false;
		}

		if( isGM(playerid) || valid ) {
			attr.set({current: adj});
			sendChat('Tracker', (isGM(playerid) ? ' ' : '')
				+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
					+'<b>'+chr.get('name') + '</b> '+( (adj<val) ? 'uses' : 'gains' )+' '+Math.abs(amount)+' '+attr.get('name')+' and has '+adj+' remaining.' 
				+'</div>'
				);
			if(!valid) {
				sendChat('Tracker', '/w gm ' 
					+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
						+'Ignoring warnings and applying adjustment anyway.  Was: '+val+'/'+max+' Now: '+adj+'/'+max
					+'</div>'
					);
			}
		}
	},
	
	HandleInput = function(msg) {
		var args,attr,amount,chr,token,text='';

		if (msg.type !== "api") {
			return;
		}

		args = msg.content.split(" ");
		switch(args[0]) {
            case '!tracker':
				if(args.length > 1) {
					chr = getObj('character', args[1]);
					if( ! chr ) {
						token = getObj('graphic', args[1]);
						if(token) {
							chr = getObj('character', token.get('represents'));
						}
					}
					if(chr) {
						if(! isGM(msg.playerid) 
							&& ! _.contains(chr.get('controlledby').split(','),msg.playerid) 
							&& ! _.contains(chr.get('controlledby').split(','),'all') 
							)
						{
							sendChat('Tracker', '<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
									+'You do not control the specified character: '+chr.id
								+'</div>'
							);
							sendChat('Tracker', '/w gm <div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
									+'<b>'+getObj('player',msg.playerid).get('_displayname')+'</b> attempted to adjust attribute <b>'+args[2]+'</b> on character <b>'+chr.get('name')+'</b>.'
								+'</div>'
							);
							return;
						}


						attr = findObjs({_type: 'attribute', _characterid: chr.id, name: args[2]})[0];
					}
					amount=parseInt(args[3],10);
					if(attr && amount) {
						adjust(msg.playerid,attr,amount);
					} else {
						if(attr) {
							sendChat('Tracker', (isGM(msg.playerid) ? '/w gm ' : '')
								+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
									+'Amount ['+args[3]+'] is not correct.  Please specify a positive or negative integer value like -1 or 4.'
								+'</div>'
							);

						} else {
							if(chr) {
								sendChat('Tracker', (isGM(msg.playerid) ? '/w gm ' : '')
									+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
										+' Attribute ['+args[2]+'] was not found.  Please verify that you have the right name.'
									+'</div>'
								);
							} else {
								sendChat('Tracker', (isGM(msg.playerid) ? '/w gm ' : '')
									+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">' 
										+( (undefined !== token) ? ('Token id ['+args[1]+'] does not represent a character. ') : ('Character/Token id ['+args[1]+'] is not valid. ') )
										+'Please be sure you are specifying it correctly, either with &#64;&#123;selected|token_id&#125; or copying the character id from: !get-represents &#64;&#123;selected|token_id&#125; '
									+'</div>'
								);
							}
						}
					}
				} else {
					showHelp(msg.playerid);
				}
                break;

			case '!get-represents':
				if(args.length > 1) {
					chr = getObj('character', args[1]);
					if( ! chr ) {
						token = getObj('graphic', args[1]);
						if(token) {
							sendChat('Tracker', (isGM(msg.playerid) ? '/w gm ' : '')
								+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
									+'The specified token represents the following character:'
									+'<ul><li>'+ ( ('' !== token.get('name')) ? token.get('name') : 'BLANK' )+' -> '+ ( ('' !== token.get('represents')) ? token.get('represents') : 'NOTHING' ) + '</li></ul>'
								+'</div>'
							);
						} else {
							sendChat('Tracker', (isGM(msg.playerid) ? '/w gm ' : '')
								+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
									+' Token id ['+args[1]+'] is not valid.'
								+'</div>'
							);
						}
					}
				} else if (msg.selected && msg.selected.length) {
					_.each(msg.selected, function(s) {
						token = getObj('graphic', s._id);
						if(token) {
							text += '<li>'+ ( ('' !== token.get('name')) ? token.get('name') : 'BLANK' )+' -> '+ ( ('' !== token.get('represents')) ? token.get('represents') : 'NOTHING' ) + '</li>';
						}
					});
					sendChat('Tracker', (isGM(msg.playerid) ? '/w gm ' : '')
						+'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
							+'The selected tokens represent the following characters:'
							+'<ul>' + text + '</ul>'
						+'</div>'
					);
				} else {
					showHelp(msg.playerid);
				}
				break;
		}

	},

	RegisterEventHandlers = function() {
		on('chat:message', HandleInput);
	};

	return {
		RegisterEventHandlers: RegisterEventHandlers
	};
}());

on("ready",function(){
	'use strict';

    var Has_IsGM=false;
    try {
        _.isFunction(isGM);
        Has_IsGM=true;
    }
    catch (err)
    {
        log('--------------------------------------------------------------');
        log('Ammo requires the isGM module to work.');
        log('isGM GIST: https://gist.github.com/shdwjk/8d5bb062abab18463625');
        log('--------------------------------------------------------------');
    }

    if( Has_IsGM )
    {
        Tracker.RegisterEventHandlers();
    }
});
