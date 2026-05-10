import './SurpriseMessage.css';

const SurpriseMessage = ({ isVisible }) => {
  return (
    <div className={`surprise-container ${isVisible ? 'visible' : ''}`}>
      <div className="surprise-content">
        <h1 className="birthday-title">Happy Birthday!</h1>
        <p className="birthday-text">
          I love you to the stars and back! ✨<br />
          You are the brightest star in my sky. 
        </p>
        <div className="photo-placeholder">
          <p>❤️</p>
        </div>
      </div>
    </div>
  );
};

export default SurpriseMessage;
