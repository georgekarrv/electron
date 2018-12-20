<template>
  <v-layout column justify-center v-if="logging_in">
    <v-flex>
      <v-progress-circular :size="70" :width="7" color="blue" indeterminate>
      </v-progress-circular>
      Logging in
    </v-flex>
  </v-layout>
  <v-layout column justify-center v-else-if="getting_devices">
    <v-flex>
      <v-progress-circular :size="70" :width="7" color="purple" indeterminate>
      </v-progress-circular>
      Getting Devices
    </v-flex>
  </v-layout>
  <v-layout column justify-left v-else>
    <v-flex>
      <v-treeview
        v-model="tree"
        :open="open"
        :items="items"
        activatable
        item-key="esn"
        transition
        open-on-click>
        <template slot="prepend" slot-scope="{ item, open, leaf }">
          <v-icon v-if="!item.type">
            {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
          </v-icon>
          <v-icon v-bind:style="{ color: statuses[item.status] }" v-else>
            {{ types[item.type] }}
          </v-icon>
        </template>
      </v-treeview>
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
  import { eenclient } from '../../lib/eagleeye'
  export default {
    data: () => ({
      // device type to icon map
      types: {
        shared: 'folder_shared',
        bridge: 'storage',
        camera: 'videocam',
        multiviewcamera: 'video-call'
      },
      // device status to color map
      statuses: {
        online: 'green',
        offline: 'red',
        off: 'yellow',
        internetoffline: 'purple',
        normal: 'default'
      },
      logging_in: false,
      getting_devices: false,
      items: []
    }),
    created () {
      // In renderer process (web page).
      var self = this
      const { ipcRenderer } = require('electron')
      /*
      ipcRenderer.on('een-login-response', (event, apiData) => {
        // login came back
        self.logging_in = false
        self.getting_devices = true
        // call list devices
        ipcRenderer.send('een-list-devices')
      })
      */
      ipcRenderer.on('een-list-devices-response', (event, apiData) => {
        // list devices came back
        // console.log('devices', apiData)
        self.getting_devices = false
        // translate devices to items
        var bridges = {
          'Shared': {
            esn: 'Shared',
            type: 'shared',
            name: 'Shared',
            status: 'normal',
            children: []
          }
        }
        for (var ii = 0; ii < apiData.length; ii++) {
          var device = eenclient.deviceFromList(apiData[ii])
          if (device.type === 'bridge') {
            device.children = []
            device.available = []
            bridges[device.esn] = device
          }
        }
        for (var jj = 0; jj < apiData.length; jj++) {
          var camera = eenclient.deviceFromList(apiData[jj])
          if (camera.type !== 'bridge') {
            if (camera.isProxy) {
              bridges['Shared'].children.push(camera)
            } else if (bridges[camera.bridge] !== undefined) {
              if (camera.cameraState === 'ATTD') {
                bridges[camera.bridge].children.push(camera)
              } else {
                bridges[camera.bridge].available.push(camera)
              }
            } else {
              console.log('couldnt find place for ', camera.esn, camera)
            }
          }
        }
        var items = []
        for (var key in bridges) {
          if (key === 'Shared' && bridges[key].children.length > 0) {
            items.push(bridges[key])
          } else {
            items.push(bridges[key])
          }
        }
        self.items = items
      })
      self.getting_devices = true
      ipcRenderer.send('een-list-devices')
    }
  }
</script>

<codepen-resources lang="json">
  {
    "css": ["https://cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css"]
  }
</codepen-resources>
