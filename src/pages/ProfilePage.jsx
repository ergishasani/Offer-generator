// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import "../assets/styles/pages/_profilePage.scss";

export default function ProfilePage() {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for company details
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [street, setStreet] = useState("");
  const [zipCity, setZipCity] = useState("");
  const [country, setCountry] = useState("Deutschland");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [vatNumber, setVatNumber] = useState("");

  // 1) Listen for Auth state; once we have a user, fetch profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchProfile(currentUser.uid);
      } else {
        setUser(null);
        setLoadingProfile(false);
      }
    });
    return () => unsubscribe();
  }, [auth, fetchProfile]);

  // 2) Fetch existing profile from Firestore
  const fetchProfile = React.useCallback(
    async (uid) => {
      setLoadingProfile(true);
      try {
        const profileRef = doc(db, "users", uid, "companyProfile", "profile");
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setName(data.name || "");
          setLogoUrl(data.logoUrl || "");
          setStreet(data.street || "");
          setZipCity(data.zipCity || "");
          setCountry(data.country || "Deutschland");
          setPhone(data.phone || "");
          setEmail(data.email || "");
          setWebsite(data.website || "");
          setVatNumber(data.vatNumber || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    },
    [db]
  );

  // 3) Handle logo file selection
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  // 4) Upload logo to Firebase Storage, return URL
  const uploadLogoAndGetUrl = async (uid) => {
    if (!logoFile) return logoUrl || ""; // no new file chosen
    const storageRef = ref(
      storage,
      `companyLogos/${uid}/${Date.now()}_${logoFile.name}`
    );
    const uploadTask = uploadBytesResumable(storageRef, logoFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          // on complete
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // 5) Handle form submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // 5a) If a new logo file was chosen, upload it and get URL
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        finalLogoUrl = await uploadLogoAndGetUrl(user.uid);
      }

      // 5b) Build the profile object
      const profileData = {
        name: name.trim(),
        logoUrl: finalLogoUrl,
        street: street.trim(),
        zipCity: zipCity.trim(),
        country: country.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        vatNumber: vatNumber.trim(),
      };

      // 5c) Save (merge) into Firestore
      const profileRef = doc(db, "users", user.uid, "companyProfile", "profile");
      // If document exists, update; if not, set
      const docSnap = await getDoc(profileRef);
      if (docSnap.exists()) {
        await updateDoc(profileRef, profileData);
      } else {
        await setDoc(profileRef, profileData);
      }

      alert("Profile saved successfully!");
      // After saving, clear logoFile so we don’t re‐upload the same file
      setLogoFile(null);
      setLogoUrl(finalLogoUrl);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // 6) Render
  if (!user) {
    return (
      <div className="profile-page">
        <p>Please log in to edit your company profile.</p>
      </div>
    );
  }
  if (loadingProfile) {
    return (
      <div className="profile-page">
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h2>Company Profile</h2>
      <form className="profile-form" onSubmit={handleSaveProfile}>
        {/* Company Name */}
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            className="input"
            placeholder="Your company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Logo Upload */}
        <div className="form-group">
          <label>Company Logo</label>
          {logoUrl && (
            <div className="logo-preview">
              <img src={logoUrl} alt="Logo preview" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
          />
          <small className="note">
            Upload a square PNG or JPEG (max 2MB). This will appear on your PDF.
          </small>
        </div>

        {/* Address */}
        <div className="form-group">
          <label>Street &amp; Number</label>
          <input
            type="text"
            className="input"
            placeholder="Musterstraße 10"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>ZIP &amp; City</label>
          <input
            type="text"
            className="input"
            placeholder="10967 Musterstadt"
            value={zipCity}
            onChange={(e) => setZipCity(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            className="input"
            placeholder="Deutschland"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        {/* Contact Info */}
        <div className="form-group">
          <label>Phone</label>
          <input
            type="text"
            className="input"
            placeholder="+49 30 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="input"
            placeholder="info@company.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Website</label>
          <input
            type="text"
            className="input"
            placeholder="www.company.de"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {/* VAT Number */}
        <div className="form-group">
          <label>VAT Number (USt‐IdNr.)</label>
          <input
            type="text"
            className="input"
            placeholder="DE123456789"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
