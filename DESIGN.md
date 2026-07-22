# Student Management System - Design Specification

This document details the design specifications, style guides, and CSS tokens for three primary interface layouts in the Student Management System. Use these instructions to construct the frontend UI using standard HTML, Tailwind CSS, or custom CSS components.

---

## 1. Global Typography & Design Tokens

Across these variations, key visual families have been defined. They rely on soft shadow offsets, light reflections, and layered elevations to create a 3D neumorphic, claymorphic, or glassmorphic appearance.

### Typography
* **Primary Headings & Dashboard Accents**: 
  * `Plus Jakarta Sans` (for Claymorphic views)
  * `Hanken Grotesk` (for Glassmorphic and Neumorphic views)
* **Body & Data Tables**: 
  * `Inter` or `Hanken Grotesk`
* **Font-Weights**: Light (`300`), Regular (`400`), Medium (`500`), Semi-Bold (`600`), Bold (`700`)

### Color Palette
* **Main Background**: `#EEF2F5` (Used as the reference surface for all Neumorphic/Claymorphic reflections)
* **Primary Accent (Baby Blue)**: `#55B9F3` / `#B3E5FC` (Accent color for active states, indicators, and primary buttons)
* **Secondary (Slate Grey)**: `#326578` / `#5C5F61` (For high-contrast elements, icons, and titles)
* **Error**: `#BA1A1A` / `#FFDAD6` (Absent states, cancel states)

---

## 2. Screen Specs & Class Definitions

### Screen 1: Student Detail - Claymorphic Minimalist Variant

A tactile, playful yet modern layout with soft 3D volumes representing the detail/attendance interface.

#### Decorative Background
* **Clay Blobs**: Fixed decorative circles in the background with soft boundaries and rotation animations.
  * *Blob 1*: `width: 500px; height: 500px; top: -100px; left: -150px; border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%`
  * *Blob 2*: `width: 600px; height: 400px; bottom: -50px; right: -100px; border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%`

#### CSS Utility Classes
```css
/* Card Container with out-and-inset shadows to simulate clay volume */
.clay-card {
    background: #eef2f5;
    border-radius: 2.5rem;
    box-shadow: 15px 15px 30px rgba(209, 217, 230, 0.8), 
               -15px -15px 30px rgba(255, 255, 255, 1),
               inset 2px 2px 5px rgba(255, 255, 255, 0.5),
               inset -2px -2px 5px rgba(209, 217, 230, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.6);
}

/* Button Component with tactile hover and active press animations */
.clay-btn {
    background: #eef2f5;
    border-radius: 2rem;
    box-shadow: 8px 8px 16px rgba(209, 217, 230, 0.8), 
               -8px -8px 16px rgba(255, 255, 255, 1);
    border: 2px solid rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease-in-out;
}
.clay-btn:hover {
    box-shadow: 10px 10px 20px rgba(209, 217, 230, 0.9), 
               -10px -10px 20px rgba(255, 255, 255, 1);
    transform: translateY(-2px);
}
.clay-btn:active {
    box-shadow: inset 6px 6px 12px rgba(209, 217, 230, 0.8), 
               inset -6px -6px 12px rgba(255, 255, 255, 1);
    transform: translateY(2px);
}

/* Sidebar Navigation - Active Item State */
.clay-nav-item-active {
    background: #eef2f5;
    box-shadow: inset 8px 8px 16px rgba(209, 217, 230, 0.8), 
               inset -8px -8px 16px rgba(255, 255, 255, 1);
    border: 2px solid rgba(255, 255, 255, 0.4);
}

/* Calendar Cells - Normal Outset */
.clay-cell {
    background: #eef2f5;
    border-radius: 1.5rem;
    box-shadow: 6px 6px 12px rgba(209, 217, 230, 0.7), 
               -6px -6px 12px rgba(255, 255, 255, 1);
    border: 1px solid rgba(255, 255, 255, 0.6);
}

/* Calendar Cells - Active Inset */
.clay-cell-inset {
    background: #eef2f5;
    border-radius: 1.5rem;
    box-shadow: inset 6px 6px 12px rgba(209, 217, 230, 0.8), 
               inset -6px -6px 12px rgba(255, 255, 255, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

#### Page Layout Structure
* **Sidebar (320px width)**: Sticky element containing Name/ID header, Navigation links (*Student Profile, Attendance [active], Grades, Schedule, Documents*), and a bottom *Generate Fee Export* button.
* **Header**: "Attendance Calendar - October 2023" with pagination chevrons inside circular clay buttons.
* **Attendance Calendar**: A grid (`grid-cols-7`) with bold days-of-the-week labels. Each cell represents a day, showing either:
  * Inactive past month days (40% opacity).
  * Attended days (`clay-cell-inset` + light blue background + blue dot indicator).
  * Absent days (Red bold text + "Absent" status text).
  * Today's cell (Active class with deep blue border accent).
* **Summary Row**: 3 columns of clay-cards displaying statistical metrics:
  * Attendance Rate: 92%
  * Absences: 1 (Red indicator)
  * Tardies: 0 (Grey indicator)

---

### Screen 2: Student List - Glassmorphic Neumorphic Variant

A clean admin roster page featuring frosted glass panels (glassmorphism) layered over neumorphic shadows and structural geometric decorations.

#### Decorative Background
* **Geometric Rings**: Large fixed overlapping circles to show off the frosted glass blur.
  * *Ring 1 (Top Right)*: `width: 400px; height: 400px; border-radius: 50%; border: 40px solid rgba(255, 255, 255, 0.3);`
  * *Ring 2 (Bottom Left)*: `width: 500px; height: 500px; border-radius: 50%; border: 60px solid rgba(255, 255, 255, 0.2);`

#### CSS Utility Classes
```css
/* Glassmorphic Panel over Neumorphic Shadow base */
.neumorphic {
    background: rgba(238, 242, 245, 0.4);
    box-shadow: 8px 8px 16px #d1d9e0, -8px -8px 16px #ffffff;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Inset variant for inputs or active list elements */
.neumorphic-inset {
    background: rgba(238, 242, 245, 0.4);
    box-shadow: inset 6px 6px 12px #d1d9e0, inset -6px -6px 12px #ffffff;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Primary Action Buttons (Ice Blue Neumorphic style) */
.neumorphic-button {
    background: #B3E5FC;
    box-shadow: 6px 6px 12px #9ecae0, -6px -6px 12px #c8ffff;
    border: 1px solid rgba(255, 255, 255, 0.6);
    transition: all 0.2s ease;
}
.neumorphic-button:active {
    box-shadow: inset 4px 4px 8px #9ecae0, inset -4px -4px 8px #c8ffff;
}

/* Secondary Action Buttons / Logout Buttons */
.neumorphic-logout {
    background: rgba(238, 242, 245, 0.6);
    box-shadow: 4px 4px 10px #d1d9e0, -4px -4px 10px #ffffff;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;
}
.neumorphic-logout:active {
    box-shadow: inset 4px 4px 8px #d1d9e0, inset -4px -4px 8px #ffffff;
}
```

#### Page Layout Structure
* **Sidebar (256px width)**: Administrative links (*Dashboard, Enrollment [active], Academic Records, Billing, Settings*) with a prominent *New Registration* center button.
* **Top Header Bar**: Sticky Glassmorphic banner displaying the center name and a *Logout* trailing button.
* **Main Roster**:
  * Title: "Student Roster" + description + "Add New Student" primary action button.
  * Header Table Row: Labels for Student ID, Name, and Actions.
  * Roster Items: Neumorphic cards that lift slightly on hover (`hover:-translate-y-1 transition-transform`). Each row displays student ID (e.g. `#STU-0842`), Full Name, and a circular trailing menu action.

---

### Screen 3: Fee Export Overlay - Extended with QR Payment

A neumorphic transaction modal designed to calculate student fees and present payment channels, including a scan-to-pay QR module.

#### Background Layout
* Layered over the student details backdrop, utilizing decorative neumorphic spheres.
  * *Spheres*: `border-radius: 50%; background: #eef2f5; box-shadow: 20px 20px 60px #cad0d3, -20px -20px 60px #ffffff;`

#### CSS Utility Classes
```css
/* Neumorphic Flat surface */
.neu-flat {
    background: #eef2f5;
    box-shadow: 20px 20px 60px #cad0d3, -20px -20px 60px #ffffff;
}

/* Neumorphic Inset slot */
.neu-inset {
    background: #eef2f5;
    box-shadow: inset 8px 8px 16px #cad0d3, inset -8px -8px 16px #ffffff;
}

/* Accent Neumorphic Button */
.neu-button {
    background: #e0f2fe; /* Pale blue container */
    box-shadow: 6px 6px 12px #b0c2cc, -6px -6px 12px #ffffff;
    transition: all 0.2s ease-in-out;
}
.neu-button:active {
    box-shadow: inset 4px 4px 8px #b0c2cc, inset -4px -4px 8px #ffffff;
}
```

#### Layout Structure
* **Modal Frame (`max-w-md`)**: Neumorphic flat panel with top margin and padding.
  * *Header*: Student billing meta, Student Name (Alex Johnson), and close icon.
  * *Form fields*:
    * "Fee per session ($)": Neumorphic inset text input field with icon prefix (default value `$25`).
    * "Total Attended Days": Neumorphic inset block displaying calendar count (`18 days`).
  * *Calculation Panel*: Neumorphic inset card summarizing calculation results:
    * "Total Calculated Fee" -> **$450.00**
  * *Payment Section*:
    * "Actual Studying Fee" input field.
    * "Export to Excel" action button.
    * QR Code module: High contrast scan-to-pay block with Neumorphic framing (`.neu-button`) containing the payment gateway QR image and label "Scan to Pay".

---

## 3. Integration Plan & Tailwind Configuration

If using Tailwind CSS alongside custom Neumorphic/Claymorphic classes, extend the Tailwind configuration:

```js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        "background": "#EEF2F5",
        "primary": "#50616b",
        "secondary": "#5C5F61",
        "tertiary": "#006591",
        "surface-tint": "#50616b",
        "error": "#ba1a1a"
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2.5rem",
      }
    }
  }
}
```
