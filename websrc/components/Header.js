import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Crown, Home, Maximize2, RotateCcw, Settings } from 'lucide-react';
export function Header({ onHome, onAdmin, onReset }) {
    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        }
        else {
            await document.exitFullscreen();
        }
    };
    return (_jsxs("header", { className: "topbar", children: [_jsxs("button", { className: "brand", onClick: onHome, children: [_jsx("span", { className: "brand-mark", children: _jsx(Crown, { size: 20 }) }), _jsxs("span", { children: ["\uB3C4\uC804 ", _jsx("strong", { children: "\uBC14\uC774\uBE14" }), " \uACE8\uB4E0\uBCA8"] })] }), _jsxs("div", { className: "topbar-actions", children: [_jsx("button", { className: "icon-button", onClick: onHome, title: "\uD648", children: _jsx(Home, { size: 19 }) }), _jsx("button", { className: "icon-button", onClick: onAdmin, title: "\uAD00\uB9AC\uC790 \uD398\uC774\uC9C0", children: _jsx(Settings, { size: 19 }) }), _jsx("button", { className: "icon-button", onClick: onReset, title: "\uC810\uC218 \uCD08\uAE30\uD654", children: _jsx(RotateCcw, { size: 19 }) }), _jsx("button", { className: "icon-button", onClick: toggleFullscreen, title: "\uC804\uCCB4\uD654\uBA74", children: _jsx(Maximize2, { size: 19 }) })] })] }));
}
