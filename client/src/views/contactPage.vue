<template>
  <div class="container">
    <div class="screen">
      <div class="card mt-4">
        <div class="card-header text-center">
          <p>Contact us</p>
        </div>
        <div class="card-body d-flex justify-content-center align-items-center flex-column">
          <h3>
            <a href="mailto:Example@email.com" class="email-link">moontrekcsula@gmail.com</a>
          </h3>
        </div>
        <div class="contact-form">
          <div class="contact-form-group message">
            <textarea
              id="message"
              v-model="message"
              class="contact-form-edit-message"
              placeholder="Message"
              rows="10"
              cols="20"
            ></textarea>
          </div>
          <div class="contact-form-group buttons">
            <button @click="clearMessage" class="contact-form-button">
              Cancel
            </button>
            <button @click="sendMessage" class="contact-form-button">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  data() {
    return {
      message: "",
    };
  },
  methods: {
    sendMessage() {
      const email = "moontrekcsula@gmail.com"; // Replace with actual email
      const subject = "Message from Contact form";
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(this.message)}`;
      window.open(mailtoUrl, "_blank");
    },
    clearMessage() {
      this.message = "";
    },
  },
};
</script>

<style scoped>
body,
button,
input {
  background: linear-gradient(to right, #212529 0%, 212526 100%);

  font-size: 1.3em;
  font-family: "Montserrat", sans-serif;
  letter-spacing: 1.4px;
}

.container {
  flex: 3 3 1000px;
  margin: auto;
  padding: 2px;
}

p {
  color: white;
}

.card {
  border: none;
  background-color: #303639;
  font-weight: bold;
  text-align: left;
  margin: auto;
  padding-bottom: 20px;
  width: calc(80%);
}

.card-body{
  text-align: center;
  width: 100%;
  margin:10px 0;
}

.contact-form-group {
  margin-bottom: 15px;
  text-align: center;
}

.contact-form-edit.email {
  text-transform: inherit;
}
.contact-form-group.message {
  margin-top: 10px;
}
.contact-form-group.buttons {
  margin-bottom: 0;
  text-align: center;
}

.contact-form-edit-message {
  width: 90%;
  padding: 10px;
  background: none;
  font-size: 16px;
  color: #ddd;
  text-transform: inherit;
  transition: border-color 0.2;
}
.contact-form-button {
  background: none;
  border: none;
  color: #ceced3;
  font-size: 16px;
  cursor: pointer;
  outline: none;
}
.contact-form-button:hover {
  color: #fff;
}

.contact-form-edit {
  width: 30%;
  padding: 10px;
  background: none;
  border: none;
  border-bottom: 1px solid #666;
  color: #ddd;
  font-size: 16px;
  text-transform: capitalize;
  outline: none;
  transition: border-color 0.2s;
}

.email-link{
  color: #5e81ac;
  text-decoration: none;
}

.email-link:hover{
  color: #ffffff;
}
</style>
