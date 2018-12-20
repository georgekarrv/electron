<template>
  <v-layout column justify-center>
    <v-flex>
      <form>
        <v-text-field
          v-model="username"
          :rules="[rules.required, rules.email]"
          label="E-mail"
        ></v-text-field>
        <v-text-field
          v-model="password"
          :append-icon="showpass ? 'visibility_off' : 'visibility'"
          :rules="[rules.required, rules.mineight]"
          :type="showpass ? 'text' : 'password'"
          label="Password"
          error
          @click:append="showpass = !showpass"
        ></v-text-field>
        <v-checkbox
          v-model="remember"
          value="0"
          label="Remember me"
          data-vv-name="checkbox"
          type="checkbox"
        ></v-checkbox>
        <v-btn @click="login" :loading="logging_in">submit</v-btn>
        <v-btn @click="clear">clear</v-btn>
      </form>
    </v-flex>
  </v-layout>
</template>

<style scoped>
  img {
    margin-left: auto;
    margin-right: auto;
    display: block;
  }
</style>
<script>
  export default {
    data: () => ({
      logging_in: false,
      username: '',
      password: '',
      remember: false,
      showpass: false,
      rules: {
        required: value => !!value || 'Required.',
        counter: value => value.length <= 20 || 'Max 20 characters',
        mineight: value => value.length >= 8 || 'At least 8 characters',
        email: value => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return pattern.test(value) || 'Invalid e-mail.'
        }
      }
    }),
    methods: {
      login: function (event) {
        var self = this
        const { ipcRenderer } = require('electron')
        // `this` inside methods points to the Vue instance
        ipcRenderer.on('een-login-response', (event, apiData) => {
          // login came back
          self.logging_in = false
          self.$router.push('dashboard')
        })
        self.logging_in = true
        ipcRenderer.send('een-login', self.username, self.password)
      },
      clear: function (event) {
        var self = this
        self.username = ''
        self.password = ''
      }
    }
  }
</script>

<codepen-resources lang="json">
  {
    "css": ["https://cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css"]
  }
</codepen-resources>
