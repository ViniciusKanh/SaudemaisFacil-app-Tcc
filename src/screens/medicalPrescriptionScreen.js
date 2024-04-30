//medicalPrescriptionScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, storage } from "../config/firebaseConfig";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import Icon from "react-native-vector-icons/FontAwesome";
import * as LocalAuthentication from 'expo-local-authentication';


// Componente da tela de prescrições médicas
const MedicalPrescriptionScreen = () => {
  // Estados do componente
  const [prescriptions, setPrescriptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [medicamento, setMedicamento] = useState("");
  const [tipoReceita, setTipoReceita] = useState("");
  const [typesPrescription, setTypesPrescription] = useState([]);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState(null);

  // Efeito para buscar os tipos de receita e as prescrições
  useEffect(() => {
    const fetchTypesPrescription = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "TypePrescription"));
        const fetchedTypes = querySnapshot.docs.map(doc => ({
          label: doc.data().Type,
          value: doc.id
        }));
        setTypesPrescription(fetchedTypes);
      } catch (error) {
        console.error("Erro ao buscar tipos de prescrição:", error);
        Alert.alert("Erro", "Não foi possível buscar os tipos de prescrição.");
      }
    };
  
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchPrescriptions(user.uid); // Passa o UID diretamente para a função de buscar prescrições
      } else {
        setPrescriptions([]); // Limpa as prescrições se não houver usuário logado
      }
    });
  
    fetchTypesPrescription();
    promptForBiometricAuthentication();
  
    return () => unsubscribe(); // Limpa o observador de estado de autenticação quando o componente é desmontado
  }, []);
  
  const fetchPrescriptions = async (userID) => {
    try {
      const presQuery = query(collection(db, "medicalPrescription"), where("ID_users", "==", userID));
      const querySnapshot = await getDocs(presQuery);
      const prescriptionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPrescriptions(prescriptionsList);
    } catch (error) {
      console.error("Erro ao buscar prescrições médicas:", error);
      Alert.alert("Erro", "Não foi possível buscar as prescrições médicas.");
    }
  };
  
  
  // Função para fechar o modal
  const onClose = () => {
    setModalVisible(false);
    setSelectedImage(null); // Limpa a imagem selecionada
    setMedicamento(""); // Limpa o campo de medicamento
    setTipoReceita(""); // Reseta a seleção do tipo de receita
  };

  // Função para escolher uma foto da galeria
  const handleChoosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    // Verifica se o resultado não foi cancelado e possui a propriedade 'uri'
    if (!result.cancelled && result.uri) {
      setSelectedImage(result.uri); // Atualiza o estado corretamente
      console.log("Imagem selecionada:", result.uri);
    } else if (!result.cancelled && result.assets && result.assets[0].uri) {
      // Caso a estrutura inclua um array 'assets'
      setSelectedImage(result.assets[0].uri);
      console.log("Imagem selecionada:", result.assets[0].uri);
    } else {
      console.log("Nenhuma imagem foi selecionada.");
    }
  };
  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("É necessário conceder permissão para acessar a câmera.");
      return;
    }

    // Lança a câmera para o usuário tirar uma foto
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // Permite edição básica, como recorte
      aspect: [4, 3],
      quality: 1, // Ajuste conforme necessário para gerenciar o tamanho do arquivo
    });

    // Verifica se o usuário não cancelou a captura da foto
    if (!result.cancelled) {
      // Atualiza o estado com o URI da imagem capturada
      // A estrutura de `result` mudou em versões mais recentes do expo-image-picker.
      // Agora, result.assets é um array de objetos, cada um representando uma imagem ou vídeo selecionados.
      // Verifica se result.assets existe e possui ao menos um item com 'uri'
      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setSelectedImage(result.assets[0].uri);
        console.log("Foto capturada:", result.assets[0].uri);
      } else {
        // Se result.assets não estiver no formato esperado, usa result.uri diretamente
        // Isso é útil para manter compatibilidade com versões anteriores do expo-image-picker
        setSelectedImage(result.uri);
        console.log("Foto capturada:", result.uri);
      }
    } else {
      console.log("Captura de foto cancelada.");
    }
  };

  // Função para enviar a prescrição para o banco de dados
  const handleUploadPrescription = async () => {
    if (!selectedImage) {
      alert("Por favor, selecione uma imagem.");
      return;
    }

    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = (e) => {
          console.error(e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", selectedImage, true);
        xhr.send(null);
      });

      const fileRef = ref(storage, `prescriptions/${new Date().toISOString()}`);
      await uploadBytes(fileRef, blob);
      blob.close();

      const downloadUrl = await getDownloadURL(fileRef);
      const auth = getAuth();
      const user = auth.currentUser;
      const userID = user ? user.uid : "";

      await addDoc(collection(db, "medicalPrescription"), {
        ID_users: userID,
        Medicamento: medicamento,
        dateTime: new Date(),
        file: downloadUrl,
        type: tipoReceita,
      });

      setModalVisible(false);
      setSelectedImage(null); // Limpar a imagem selecionada
      setMedicamento(""); // Limpa o campo de medicamento
      setTipoReceita(""); // Reseta a seleção do tipo de receita
      fetchPrescriptions(); // Recarrega as prescrições
      alert("Prescrição salva com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar prescrição: ", error);
      alert("Erro ao salvar prescrição.");
    }
  };

  // Adicione uma função para deletar uma prescrição
  const deletePrescription = async (id) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza de que deseja excluir esta prescrição?",
      [
        { text: "Cancelar" },
        {
          text: "Excluir",
          onPress: async () => {
            await deleteDoc(doc(db, "medicalPrescription", id));
            fetchPrescriptions(); // Atualiza a lista após a exclusão
          },
        },
      ]
    );
  };

  // Atualiza a função de edição para usar o novo estado
  const editPrescription = (prescription) => {
    setMedicamento(prescription.Medicamento);
    setTipoReceita(prescription.type);
    setSelectedImage(prescription.file);
    setCurrentPrescriptionId(prescription.id); // Armazena o ID da prescrição atual para edição
    setModalVisible(true);
  };

  // Renderiza cada item da lista de prescrições
  const renderPrescription = ({ item }) => (
    <View style={styles.prescriptionCard}>
      <Text style={styles.cardText}>
        <Text style={styles.boldText}>Medicamento:</Text> {item.Medicamento}
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.boldText}>Tipo:</Text> {item.type}
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.boldText}>Data:</Text>{" "}
        {item.dateTime.toDate().toLocaleDateString()}
      </Text>
      {item.file && (
        <Image source={{ uri: item.file }} style={styles.cardImage} />
      )}
      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => editPrescription(item)}>
          <Icon name="edit" size={24} color="blue" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deletePrescription(item.id)}>
          <Icon name="trash" size={24} color="red" style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const promptForBiometricAuthentication = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
    
    if (compatible && savedBiometrics) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Autenticação necessária',
          cancelLabel: 'Cancelar', // Deve ser uma string, não um booleano
          fallbackLabel: 'Use sua senha',
        });
  
        if (result.success) {
          // Autenticação bem-sucedida, continue a execução normalmente
        } else {
          // Autenticação falhou ou foi cancelada
          Alert.alert('Autenticação necessária', 'Autenticação via Face ID falhou ou foi cancelada. Você não pode acessar esta área sem autenticação.');
          // Ação após falha, como voltar à tela anterior
        }
      } catch (error) {
        // Tratamento de erro da tentativa de autenticação
        Alert.alert('Erro de autenticação', 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.');
      }
    } else {
      // Hardware não compatível ou sem biometria configurada
      Alert.alert('Sem suporte a Face ID', 'Seu dispositivo não suporta ou não tem Face ID configurado.');
      // Ação após detecção de falta de suporte ou configuração, como voltar à tela anterior
    }
  };
  // Renderização do componente
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Cadastrar Receita</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.LabelMedicamento}>
              Titulo da Prescrição / Receita:
            </Text>
            <TextInput
              style={styles.input}
              onChangeText={setMedicamento}
              value={medicamento}
              placeholder="Um Resumo curto da Receita / Prescrição"
            />

            <Text style={styles.label}>Categoria de Receita:</Text>
            <Picker
              selectedValue={tipoReceita}
              onValueChange={(itemValue) => setTipoReceita(itemValue)}
              style={styles.picker}
            >
              {typesPrescription.map((type) => (
                <Picker.Item
                  key={type.value}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
            <View style={{ height: 180 }} />
            {/*
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
              />
            )}
            <View style={{ height: 80 }} />
            */}
            <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
              <Text style={styles.buttonText}>Tirar Foto</Text>
            </TouchableOpacity>
            <View style={{ height: 80 }}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleChoosePhoto}
              >
                <Text style={styles.buttonText}>Escolher Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: selectedImage ? "#007bff" : "gray" },
                ]}
                onPress={handleUploadPrescription}
                disabled={!selectedImage}
              >
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 60 }} />
          </View>
        </View>
      </Modal>

      {/* Lista de prescrições */}
      <FlatList
        data={prescriptions.sort((a, b) => {
          // Sort by date from newest to oldest
          return (
            new Date(b.dateTime.seconds * 1000) -
            new Date(a.dateTime.seconds * 1000)
          );
        })}
        renderItem={renderPrescription}
        keyExtractor={(item) => item.id.toString()}
        style={{ width: "100%" }}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#007bff",
    borderRadius: 20,
    paddingVertical: 15, // Ajuste a altura do botão aqui
    paddingHorizontal: 30, // Ajuste a largura do botão aqui
    margin: 12, // Margem ao redor do botão
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { height: 2, width: 0 },
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    margin: 20,
    justifyContent: "space-around", // Garante um espaçamento uniforme entre os itens
    backgroundColor: "white",
    borderRadius: 25,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    width: "90%",
    height: "70%",
    marginTop: -80,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginTop: 10, // Espaço a partir do topo do modal
    marginRight: 10, // Espaço a partir da direita do modal
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  messageText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    padding: 10,
    marginVertical: 10,
  },
  input: {
    height: 40,
    width: "100%", // Pode usar a largura total do modal
    margin: -10,
    marginVertical: 39,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  label: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginTop: 10, // Ajuste a margem superior para dar espaço entre a label e o Picker
    fontSize: 23, // Ajuste conforme necessário
  },
  LabelMedicamento: {
    alignSelf: "flex-start",
    marginLeft: 1,
    marginVertical: -0,
    marginTop: 30,
    fontSize: 22,
  },
  previewImage: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listItemText: {
    fontSize: 18,
    marginBottom: 10,
  },
  prescriptionCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 5,
  },
  boldText: {
    fontWeight: "bold",
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  icon: {
    marginHorizontal: 10,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default MedicalPrescriptionScreen;
