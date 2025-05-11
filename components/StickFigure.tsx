// import L from "leaflet";

// // Custom White Stick Figure Icon (with light blue outline for contrast)
// const stickFigureIcon = new L.DivIcon({
//     className: "custom-marker",
//     html: `
//         <div style="
//             display: flex; 
//             flex-direction: column; 
//             align-items: center; 
//             text-align: center;
//             font-size: 20px;
//             gap: 2px;">
            
//             <!-- Head -->
//             <div style="
//                 width: 12px; 
//                 height: 12px; 
//                 background-color: white; 
//                 border-radius: 50%;
//                 border: 2px solid #ADD8E6;"></div>
            
//             <!-- Arms and Body -->
//             <div style="display: flex; align-items: center; gap: 2px;">
//                 <div style="
//                     width: 8px; 
//                     height: 2px; 
//                     background-color: white;
//                     border: 1px solid #ADD8E6;"></div>
//                 <div style="
//                     width: 2px; 
//                     height: 18px; 
//                     background-color: white;
//                     border: 1px solid #ADD8E6;"></div>
//                 <div style="
//                     width: 8px; 
//                     height: 2px; 
//                     background-color: white;
//                     border: 1px solid #ADD8E6;"></div>
//             </div>

//             <!-- Legs -->
//             <div style="display: flex; gap: 4px;">
//                 <div style="
//                     width: 3px; 
//                     height: 12px; 
//                     background-color: white;
//                     border: 1px solid #ADD8E6;"></div>
//                 <div style="
//                     width: 3px; 
//                     height: 12px; 
//                     background-color: white;
//                     border: 1px solid #ADD8E6;"></div>
//             </div>
//         </div>
//     `,
//     iconSize: [15, 35],
//     iconAnchor: [7, 35],
// });

// export default stickFigureIcon;


import L from "leaflet";

// Custom Current Location Marker (Blue Circle with Pulse Effect)
const currentLocationIcon = new L.DivIcon({
    className: "custom-location-marker",
    html: `
        <div style="
            width: 15px; 
            height: 15px; 
            background-color: #276EF1; 
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(39, 110, 241, 0.6);
            position: relative;">
            <div style="
                position: absolute;
                width: 30px; 
                height: 30px; 
                background-color: rgba(39, 110, 241, 0.3); 
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: pulse 1.5s infinite;">
            </div>
        </div>
        <style>
            @keyframes pulse {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
        </style>
    `,
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
});

export default currentLocationIcon;
