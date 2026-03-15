import "./settings.css"
import pfp from "../header/images/Avatar.svg"
import Image from "next/image";
import { useState } from "react";

const Settings = ({ displayMode }: { displayMode: string }) => {
  const [activeTab, setActiveTab] = useState<string>("Profile");
  const [fullName, setFullName] = useState<string>("Jane Doe");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  // Dynamic class names based on display mode
  const isDark = displayMode === "dark";
  const settingsContainer = isDark ? "settings--container" : "settings--container-lm";
  const userInfoClass = isDark ? "user-info" : "user-info-lm";
  const updateProfileClass = isDark ? "update-profile" : "update-profile-lm";
  const personalInfoClass = isDark ? "personal--info" : "personal--info-lm";
  const cardClass = isDark ? "settings-card" : "settings-card-lm";
  const tabClass = isDark ? "tab" : "tab-lm";
  const activeTabClass = isDark ? "active-tab" : "active-tab-lm";
  const buttonClass = isDark ? "settings-button" : "settings-button-lm";
  return (
    <main className={settingsContainer}>
      <div className="page-header">
        <h2 className="settings-title">Settings</h2>
        <p className="welcome-text">Welcome to your Settings</p>
        <div className="breadcrumb">
          <span className="breadcrumb-item">Home</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item active">Settings</span>
        </div>
      </div>
      
      <div className="settings-tabs">
        {["Profile", "Application", "Security", "Activity", "Payment Method", "API"].map((tab) => (
          <button 
            key={tab}
            className={`${tabClass} ${activeTab === tab ? activeTabClass : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "Profile" && (
        <div className="settings-content">
          <div className="settings-section">
            <div className="user-update--container">
              <div className="user--container">
                <h3 className="section-title">User Profile</h3>
                <div className={`${userInfoClass} ${cardClass}`}>
                  <div className="form-group">
                    <label className="form-label">Full name</label>
                    <input 
                      className="form-input" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="pfp-container">
                    <div className="avatar-wrapper">
                      <Image src={pfp} alt="Profile picture" width={80} height={80} className="avatar-image" />
                      <button className="change-avatar-btn">Change</button>
                    </div>
                    <div className="user-info-text">
                      <h4 className="user-name">{fullName}</h4>
                      <p className="user-welcome">Welcome to the settings page</p>
                    </div>
                  </div>
                  
                  <button className={buttonClass}>Save</button>
                </div>
              </div>
              
              <div className="profile--container">
                <h3 className="section-title">Update Profile</h3>
                <div className={`${updateProfileClass} ${cardClass}`}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      className="form-input" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <button className={buttonClass}>Save</button>
                </div>
              </div>
            </div>
            <div className={personalInfoClass}>
              <h3 className="section-title">Personal Information</h3>
              <div className={`info--container ${cardClass}`}>
                {[
                  { label: "Address", placeholder: "Enter your address" },
                  { label: "City", placeholder: "Enter your city" },
                  { label: "Country", placeholder: "Enter your country" },
                  { label: "Phone", placeholder: "Enter your phone number" },
                  { label: "Date of Birth", placeholder: "MM/DD/YYYY" },
                  { label: "Occupation", placeholder: "Enter your occupation" }
                ].map((field, index) => (
                  <div className="info-field" key={index}>
                    <label className="form-label">{field.label}</label>
                    <input className="form-input" placeholder={field.placeholder} />
                  </div>
                ))}
                <button className={buttonClass}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab !== "Profile" && (
        <div className="settings-content">
          <div className={`${cardClass} coming-soon-card`}>
            <h3>{activeTab} Settings</h3>
            <p>This section is coming soon.</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default Settings;
