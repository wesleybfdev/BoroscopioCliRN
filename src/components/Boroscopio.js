import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import socket from 'react-native-udp';
import { Buffer } from 'buffer'

// Configuração do Boroscópio
const serverAddress = '192.168.10.123';
const serverPort = 8030;
const randomPort = Math.floor(Math.random() * (65535 - 5000 + 1)) + 5000;

const Boroscopio = () => {
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    const udpClient = socket.createSocket({
      type: 'udp4',
      reusePort: true,
      debug: false,
    });

    udpClient.bind(randomPort, () => {
      console.log(`Socket vinculado à porta ${randomPort}`);

      const sendData = new Uint8Array([
        0x99, 0x99, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);

      udpClient.send(sendData, 0, sendData.length, serverPort, serverAddress, (error) => {
        if (error) {
          console.error(`Erro ao enviar mensagem: ${JSON.stringify(error)}`);
          return;
        }

        console.log('Mensagem enviada para o boroscópio');
      });
    });

    // Configura o evento de resposta
    udpClient.on('message', (msg, rinfo) => {
      if (msg && rinfo) {
        const base64String = msg.toString('base64');
        processFrames(base64String.slice(32, base64String.length));
      }
    });

    return () => {
      udpClient.close();
    };
  }, []);

  let frameSize = 0
  let frameArr = []

  let framesListArr = []
  let newImage = []

  function processFrames(base64String) {
    if (base64String.includes('/9j/')) {

      const binaryFrames = framesListArr.map(frame => Buffer.from(frame, 'base64'));
      const mergedBinary = Buffer.concat(binaryFrames);
      console.log(mergedBinary.toString('base64'))
      // newImage = `data:image/jpeg;base64,${mergedBinary.toString('base64')}`
      // console.log(newImage)

      newImage = framesListArr

      framesListArr = []
    } 
    
    framesListArr.push(base64String)
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
      {/* {imageData && (
        <Image
          source={{ uri: imageData }}
          style={{ width: 300, height: 200 }}
        />
      )} */}
    </View>
  );
};

export default Boroscopio;
