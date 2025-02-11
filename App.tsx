import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Boroscopio from './src/components/Boroscopio';

function App() {
  return (
    <View style={styles.container}>
      <Boroscopio />
      {/* 
        HOWiFi_03e5bb nao funcionou
        HOWIFI-874d58 testar e fazer rastreio no wireshark
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
