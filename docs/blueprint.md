# **App Name**: Godrej DLP Dashboard

## Core Features:

- Vertical Navigation Bar: Left-aligned vertical navigation with Dashboard, Alerts, and Policies tabs. Highlights the active tab.
- Policies Data Display: Fetches and displays policies from Supabase in a read-only table format with columns: Policy_ID, Policy_Name, Policy_Description. The table name is Policy (under the public schema)
- Supabase Connection Status: Displays Supabase connection status (Active/Inactive) and the last refresh timestamp. The supabase url is: YOUR_SUPABASE_KEY. The publishable api key/ anon key is: YOUR_SUPABASE_KEY. The secret key is: YOUR_SUPABASE_KEY
- Dashboard Placeholder: Empty placeholder section for the Dashboard tab.
- Alerts Placeholder: Empty placeholder section for the Alerts tab.

## Style Guidelines:

- Primary color: Blue (#468fd2) for action accents and general highlights.
- Background color: Off-white (#FAFAFA) to maintain a clean, professional look.
- Accent color: Magenta (#B9105E) and Green (#74bb3a) as a contrasting highlight for key UI elements.
- Body and headline font: 'Inter' sans-serif for a modern, objective feel.
- Modern card-based layout with subtle shadows and rounded corners to improve visual appeal and readability.
- Left-aligned vertical navigation bar for easy access to primary functions.
- Clean and minimal icons to represent different sections and actions.