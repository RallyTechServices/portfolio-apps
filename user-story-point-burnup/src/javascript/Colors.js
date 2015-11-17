(function () {
    var Ext = window.Ext4 || window.Ext;

    Ext.define("Rally.apps.charts.Colors", {
        singleton: true,
        // RGB values obtained from here: http://ux-blog.rallydev.com/?cat=23
        grey4: "#C0C0C0",  // $grey4
        orange: "#FF8200",  // $orange
        gold: "#F6A900",  // $gold
        yellow: "#FAD200",  // $yellow
        lime: "#8DC63F",  // $lime
        green_dk: "#1E7C00",  // $green_dk
        blue_link: "#337EC6",  // $blue_link
        blue: "#005EB8",  // $blue
        purple : "#7832A5",  // $purple,
        pink : "#DA1884",   // $pink,
        grey7 : "#666",

        cumulativeFlowColors : function() {
            return [
                Rally.apps.charts.Colors.grey4,
                Rally.apps.charts.Colors.orange,
                Rally.apps.charts.Colors.gold,
                Rally.apps.charts.Colors.yellow,
                Rally.apps.charts.Colors.lime,
                Rally.apps.charts.Colors.green_dk,
                Rally.apps.charts.Colors.blue_link,
                Rally.apps.charts.Colors.blue,
                Rally.apps.charts.Colors.purple,
                Rally.apps.charts.Colors.pink
            ];
        },

        burnLineColor : function (){ return Rally.apps.charts.Colors.blue; },
        burnColumnColor : function() { return Rally.apps.charts.Colors.lime; }
    });
}());