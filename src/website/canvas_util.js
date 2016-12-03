(function ()
{

    function Interactable(var1, var2, highlight)
    {
        this.Bitmap_constructor();

        this.addEventListener("mouseover", this.OnEnter);
        this.addEventListener("mouseout", this.OnExit);

        this.state1 = document.createElement("img");
        this.state2 = document.createElement("img");
        this.highlight = document.createElement("img");

        this.state1.src = var1;
        this.state2.src = var2;
        this.highlight.src = highlight;

        this.image = this.state1;
        this.toggle = false;
        this.hover = false;
        this.text = new createjs.Text("<free>", "15px Arial", "#FFF");
        this.info = new createjs.Text("", "15px Arial", "#FFF");

    }

    var proto = createjs.extend(Interactable, createjs.Bitmap);

    proto.SetData = function (data) {
        this.toggle = true;
        this.text.text = data.username;
        this.info.text = data.group + ' | ' + data.projectName
        this.data = data;
    }

    proto.Reset = function () {
      this.toggle = false;
      this.text.text = '<free>';
      this.info.text = ' ';
    }


    proto.OnEnter = function (e) {
        e.target.hover = true;
    }

    proto.OnExit = function (e) {
        e.target.hover = false;
    }

    proto.draw = function (ctx, ignoreCache) {
        if (this.DisplayObject_draw(ctx, ignoreCache) || !this.image) { return true; }
        var rekt = this.sourceRect;

        if (!this.toggle)
            var img = this.state1;
        else
            var img = this.state2;

        if (rekt) {
            // some browsers choke on out of bound values, so we'll fix them:
            var x1 = rekt.x, y1 = rekt.y, x2 = x1 + rekt.width, y2 = y1 + rekt.height, x = 0, y = 0, w = img.width, h = img.height;
            if (x1 < 0) { x -= x1; x1 = 0; }
            if (x2 > w) { x2 = w; }
            if (y1 < 0) { y -= y1; y1 = 0; }
            if (y2 > h) { y2 = h; }
            ctx.drawImage(img, x1, y1, x2 - x1, y2 - y1, x, y, x2 - x1, y2 - y1);
            if(this.hover)
                ctx.drawImage(this.highlight, x1, y1, x2 - x1, y2 - y1, x, y, x2 - x1, y2 - y1);
        } else {
            ctx.drawImage(img, 0, 0);
            if(this.hover)
                ctx.drawImage(this.highlight, 0, 0);
        }

        ctx.save();

        var b = this.text.getBounds();

        this.text.x = this.regX - b.width / 2;
        this.text.y = 2 * this.regY;

        this.text.updateContext(ctx);
        this.text.draw(ctx, ignoreCache);

        ctx.restore();


        ctx.save();

        var b = this.info.getBounds();

        this.info.x = this.regX - b.width / 2;
        this.info.y = 2 * this.regY + 15;

        this.info.updateContext(ctx);
        this.info.draw(ctx, ignoreCache);

        ctx.restore();

        return true;
    };

    window.Interactable = createjs.promote(Interactable, "Bitmap");

}());
