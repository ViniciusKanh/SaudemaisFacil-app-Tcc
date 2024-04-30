// LembreteScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import RemindersConsultationScreen from './Consulta/RemindersConsultationScreen';

const LembretesScreen = ({ navigation }) => {
  const [isModalVisible, setModalVisible] = useState(false);

  // Funções para abrir e fechar o modal
  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

    // Função para navegar para a tela de visualização
    const navigateToRelReminders = () => {
      navigation.navigate('Consultas');
    };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.cardTitle}>Medicamentos</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={() => {}}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => {}}>
            <Text style={styles.buttonText}>Visualizar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>Consultas</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={openModal}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={navigateToRelReminders}>
            <Text style={styles.buttonText}>Visualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <RemindersConsultationScreen isVisible={isModalVisible} onClose={closeModal} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", // Isso vai centralizar os contêineres verticalmente
    //alignItems: "center",
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#65BF85',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    margin: 15,
  },
  card: {
    backgroundColor: '#EDF3EF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#65BF85",
  },
  cardTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000000',
    textAlign: 'center',
  },
  button: {
    backgroundColor: "#ffff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#65BF85",
    marginVertical: 10, // Espaço uniforme acima e abaixo de cada botão
    width: "100%", // Faz com que o botão se expanda para a largura do contêiner
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    textAlign: "center", // Centraliza o texto no botão
  },
});

export default LembretesScreen;
