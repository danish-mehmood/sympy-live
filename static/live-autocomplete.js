Ext.ns("SymPy");

$.fn.reverse = [].reverse;

SymPy.Autocompleter = Ext.extend(Ext.util.Observable, {
    inputEl: null,
    outputEl: null,
    completions: [],
    currentCompletion: 0,

    constructor: function(config, shell) {
        config = Ext.apply({}, config);
        this.inputEl = config.input;
        this.containerEl = config.container;
        this.shell = shell;
    },

    setup: function() {
        this.toolbarEl = Ext.DomHelper.append(this.containerEl, {
            tag: 'div',
            cls: 'sympy-live-autocompletions-toolbar',
            children: [{
                tag: 'button',
                html: '&lt;'
            },{
                tag: 'button',
                html: '&gt;'
            }]
        }, true);
        this.prevEl = this.toolbarEl.down("button:nth(1)");
        this.nextEl = this.toolbarEl.down("button:nth(2)");
        this.nextEl.on("click", function(event){
            this.showNextGroup();
        }, this);
        this.prevEl.on("click", function(event){
            this.showPrevGroup();
        }, this);
        this.outputEl = Ext.DomHelper.append(this.containerEl, {
            tag: 'ol',
            cls: 'sympy-live-autocompletions',
            html: '<em>Autocompletions here</em>'
        }, true);
    },

    complete: function(statement) {
        if (statement !== null) {
            var data = {
                session: this.session || null,
                statement: statement
            };
            Ext.Ajax.request({
                method: 'POST',
                url: (this.basePath || '') + '/autocomplete',
                jsonData: Ext.encode(data),
                success: function(response) {
                    this.completionSuccess(Ext.decode(response.responseText));
                },
                failure: function(response) {
                    this.completionError(response);
                },
                scope: this
            });
        }
    },

    doComplete: function(completion) {
        this.shell.setValue(completion);
    },

    completionSuccess: function(responseJSON) {
        var completions = responseJSON['completions'];
        this.outputEl.dom.innerHTML = '';
        console.log(completions);
        if (completions.length === 1){
            this.doComplete(completions[0]);
        }
        else if(completions.length > 0){
            for(var i = 0; i < completions.length; i++){
                Ext.DomHelper.append(this.outputEl, {
                    tag: 'li',
                    html: completions[i],
                    id: this.getID(i)
                });
            }
            this.currentCompletion = 0;
        }
        else {
            Ext.DomHelper.append(this.outputEl, {
                tag: 'li',
                cls: 'sympy-live-autocompletions-none',
                html: '&lt;No completions&gt;'
            }, true);
        }
        this.completions = completions;
    },

    completionError: function(response) {
        Ext.DomHelper.append(this.outputEl, {
                tag: 'li',
                cls: 'sympy-live-autocompletions-none',
                html: '&lt;Error getting completions&gt;'
            }, true);
    },

    showNextGroup: function() {
        var current = this.currentCompletion;
        for(var i = current + 1; ; i++) {
            if (i === this.completions.length) { i = 0;}
            if(this.isShowing(i)){
                current = i;
            }
            else {
                break;
            }
        }
        $('#' + this.getID(current)).
            prevAll().
            reverse().
            appendTo($(this.outputEl.dom));
        this.currentCompletion = current;
    },

    showPrevGroup: function() {
        var current = this.currentCompletion;
        while(true) {
            this.outputEl.insertFirst(this.outputEl.last("li"));
            if(!this.isShowing(this.currentCompletion)){
                this.outputEl.first("li").appendTo(this.outputEl);
                this.currentCompletion = parseInt(
                    this.outputEl.first("li").id.split('-')[1],
                    10
                );
                console.log(this.currentCompletion);
                return;
            }
        }
    },

    getID: function(index) {
        return "completion-" + index
    },

    isShowing: function(index) {
        var y = this.outputEl.first("li").getY();
        return (Ext.fly(this.getID(index)).getY() === y);
    }
});
