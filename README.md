# Offer Generator

**Offer Generator** is a web application for creating professional price offers. Built with React and Firebase, it lets you maintain a product catalogue, generate polished PDF quotes and securely store your data in the cloud.

## Key Features

- **Offer workflow** – create drafts, edit and submit final offers
- **Product catalogue** – manage reusable products and categories
- **PDF generation** – produce branded PDFs using React PDF and jsPDF
- **Authentication** – sign in with email, Google or Apple via Firebase Auth
- **Cloud Firestore** – store offers, products and company profiles securely
- **Deployment ready** – configured for Netlify with Firestore security rules

## Technology Stack

- **Frontend:** React 19 with React Router
- **Backend:** Firebase Auth, Firestore, Storage and Analytics
- **PDF:** jsPDF and @react-pdf/renderer
- **Styling:** Sass
- **Testing:** Jest and React Testing Library

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Update Firebase credentials in `src/services/firebase.js`.
3. Start the development server:
   ```bash
   npm start
   ```
4. Run the test suite:
   ```bash
   npm test
   ```
5. Build for production:
   ```bash
   npm run build
   ```

## Deployment

The repository contains a `netlify.toml` for Netlify configuration and Firestore rules in `firestore.rules`.

## Troubleshooting

For sign‑in issues see [docs/login_guidelines.md](docs/login_guidelines.md).

## License

[MIT](LICENSE)
