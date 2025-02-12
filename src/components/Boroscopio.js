import { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';
import socket from 'react-native-udp';
import { Buffer } from 'buffer'

// Configuração do Boroscópio
const serverAddress = '192.168.10.123';
const serverPort = 8030;
const randomPort = Math.floor(Math.random() * (65535 - 5000 + 1)) + 5000;

const Boroscopio = () => {
  // Estado que armazena a imagem atualmente exibida
  const [currentImage, setCurrentImage] = useState(null);

  const frameAccumulator = useRef([]); // Array para armazenar todos os frames recebidos via socket em um array unico
  const framesToCreateImage = useRef([]); // Array para armazenar os frames que serao usados para criar uma "nova image" concatenando os frames nessa var
  const imageQueue = useRef([]); // Array para armazenar todas as imagens criadas ao concatenar os frames

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
        const frame = base64String.slice(32, base64String.length);

        frameAccumulator.current.push(frame)

        processFrames(frame)

        // console.log({
        //   frameAccumulator: frameAccumulator.current, 
        //   framesToCreateImage: framesToCreateImage.current, 
        //   imageQueue: imageQueue.current
        // })
      }
    });

    // O intervalo pode ser ajustado de acordo com sua necessidade (por exemplo, 33ms para ~30fps)
    const interval = setInterval(() => {
      if (imageQueue.current.length > 0) {
        // Remove o primeiro item da fila (FIFO) e atualiza a imagem
        const nextImage = imageQueue.current.shift();
        setCurrentImage(nextImage);
      }
    }, 500);

    return () => {
      udpClient.close();
      clearInterval(interval);
    };
  }, []);

  function processFrames(frame) {
    if (frame.startsWith('/9j/')) {
    // if (frame.startsWith('/9j/') && framesToCreateImage.current.length > 0) {
      const newImage = Buffer.concat(framesToCreateImage.current.map(frame => Buffer.from(frame, 'base64'))).toString('base64');
      imageQueue.current.push(newImage)

      framesToCreateImage.current = []
    }

    framesToCreateImage.current.push(frame)
  }

  // useEffect(() => {
  //   // O intervalo pode ser ajustado de acordo com sua necessidade (por exemplo, 33ms para ~30fps)
  //   const interval = setInterval(() => {
  //     if (imageQueue.current.length > 0) {
  //       // Remove o primeiro item da fila (FIFO) e atualiza a imagem
  //       const nextImage = imageQueue.current.shift();
  //       setCurrentImage(nextImage);
  //     }
  //   }, 500);

  //   // Limpa o intervalo ao desmontar o componente
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <View style={styles.container}>
      {currentImage ? (
        <Image
          style={styles.image}
          source={{ uri: `data:image/png;base64,${currentImage}` }}
          resizeMode="contain"
        />
      ) : (
        <View style={{ backgroundColor: 'white'}}>
          <Text>Carregando ...</Text>
        </View>
      )}

      <Button
        title="Dado atual"
        onPress={() => console.log(imageQueue.current)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9, 
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default Boroscopio;
