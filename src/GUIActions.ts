import { ClipPathManager } from './ClipPathManager';
import { ActionFill } from './ActionFill';
import { Layout } from './Layout';
import { ErrorMessage } from './ErrorMessage';
import { S } from './Script';
import { AnimationToolBar } from './AnimationToolBar';
import { OptionManager } from './OptionManager';
import { ToolMenu } from './ToolMenu';
import { Palette } from "./Palette";
import { Share } from "./share";
import { MagnetManager } from './magnetManager';
import { UserManager } from './UserManager';
import { ActionMagnetSwitchBackgroundForeground } from './ActionMagnetSwitchBackgroundForeground';
import { BoardManager } from './boardManager';

export class GUIActions {

    /**
     * fill either the last zone that was drawn
     * or the magnet under the cursor if there is one
     */
    static fill(): void {
        const magnet = MagnetManager.getMagnetUnderCursor();
        if (magnet)
            magnet.style.backgroundColor = UserManager.me.color;//MagnetManager.nextBackgroundColor
        else
            BoardManager.addAction(new ActionFill(UserManager.me.userID, UserManager.me.lastDelineation.points, UserManager.me.color));
    }

    /**
     * @description tries to paste a magnet from the content of the clipboard
     */
    static pasteFromClipBoard(): void {
        try {
            //the <any> is because Typescript does not infer properly the types :(
            (<any>(navigator.clipboard)).read().then((items) => {
                function blobToDataURL(blob: Blob, callback: (dataURL: string) => void) {
                    const a = new FileReader();
                    a.onload = function (e) { callback(<string>e.target.result); }
                    a.readAsDataURL(blob);
                }
                console.log(items[0])

                console.log(items[0].types)
                console.log(items[0].getType("image/png"));
                items[0].getType("image/png").then((blob: Blob) => blobToDataURL(blob, (dataURL) => {
                    const magnet = new Image();
                    magnet.src = dataURL;
                    magnet.style.left = Layout.getWindowLeft() + "px";
                    magnet.style.top = "0px";
                    console.log(dataURL);
                    MagnetManager.addMagnet(magnet);
                }));
            })
        }
        catch (e) {
            ErrorMessage.show(e);
        }
    }

    static palette = new Palette();
    static toolmenu = new ToolMenu();

    static paletteShowOnKey = true;

    static init(): void {
        GUIActions.palette.onchange = () => {
            if (AnimationToolBar.isActionSelected) {
                //TODO: recolorize the actions that are selected in the timeline :)
            }

            if (UserManager.me.isToolErase)
                Share.execute("switchChalk", [UserManager.me.userID]);
            Share.execute("setCurrentColor", [UserManager.me.userID, GUIActions.palette.getCurrentColor()]);



        }





        OptionManager.boolean({
            name: "paletteShowOnKey", defaultValue: true,
            onChange: (b) => { GUIActions.paletteShowOnKey = b }
        });
    }


    static changeColor(calledFromKeyBoard = false): void {
        if (!UserManager.me.tool.isDrawing && (GUIActions.paletteShowOnKey || !calledFromKeyBoard))
            GUIActions.palette.show({ x: UserManager.me.tool.x, y: UserManager.me.tool.y });
        GUIActions.palette.next();

    }

    static previousColor(calledFromKeyBoard = false): void {
        if (MagnetManager.getMagnetUnderCursor() == undefined) { //if no magnet under the cursor, change the color of the chalk
            UserManager.me.switchChalk();

            if (!UserManager.me.tool.isDrawing && (GUIActions.paletteShowOnKey || !calledFromKeyBoard))
                GUIActions.palette.show({ x: UserManager.me.tool.x, y: UserManager.me.tool.y });
            GUIActions.palette.previous();
        }
        else { // if there is a magnet change the background of the magnet
            const magnet = MagnetManager.getMagnetUnderCursor();
            magnet.style.backgroundColor = MagnetManager.previousBackgroundColor(magnet.style.backgroundColor);
        }
    }

    static switchChalkEraser(): void {
        if (!UserManager.me.isToolDraw)
            Share.execute("switchChalk", [UserManager.me.userID]);
        else
            Share.execute("switchErase", [UserManager.me.userID]);
    }



    static magnetChangeSize(ratio: number): void {
        const magnet = MagnetManager.getMagnetUnderCursor();
        if (!magnet.style.width)
            magnet.style.width = magnet.clientWidth + "px";

        magnet.style.clipPath = ClipPathManager.clipPathChangeSize(magnet.style.clipPath, ratio);
        magnet.style.width = (parseInt(magnet.style.width) * ratio) + "px";
    }

    static magnetIncreaseSize(): void { GUIActions.magnetChangeSize(1.1); }
    static magnetDecreaseSize(): void { GUIActions.magnetChangeSize(0.9); }


    /**
     * switch the "background/foreground state" of the magnet under the cursor
     * if the magnet is in the foreground, it moves that magnet background
     * if the magnet is in the background, it moves that magnet foreground
     */
    static magnetSwitchBackgroundForeground(): void {
        const magnetGetRectangle = (m: HTMLElement) => {
            const x1 = parseInt(m.style.left);
            const y1 = parseInt(m.style.top);
            return { x1: x1, y1: y1, x2: x1 + m.clientWidth, y2: y1 + m.clientHeight };
        }


        const switchBackgroundForegrounOfMagnet = (m: HTMLElement) => {
            BoardManager.addAction(new ActionMagnetSwitchBackgroundForeground(UserManager.me.userID, m.id));
        }

        /** get the magnet under the cursor for magnet that are in the background (cannot use the standard mousemove
         * because these magnets are hidden by the canvas) */
        const getMagnetBackgroundUnderCursor = () => {
            const magnets = MagnetManager.getMagnets();
            for (let i = 0; i < magnets.length; i++) {
                const m = magnets[i];
                if (S.inRectangle({ x: x, y: y }, magnetGetRectangle(m))) {
                    return m;
                }
            }
            return undefined;
        }
        const magnet = MagnetManager.getMagnetUnderCursor();
        const x = UserManager.me.x;
        const y = UserManager.me.y;
        console.log(x, y);


        if (magnet == undefined) {
            const m = getMagnetBackgroundUnderCursor();
            if (m)
                switchBackgroundForegrounOfMagnet(m);
        }
        else switchBackgroundForegrounOfMagnet(magnet);

    }

}