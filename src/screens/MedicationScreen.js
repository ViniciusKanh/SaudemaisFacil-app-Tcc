//MedicationScreen.js

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
  ScrollView,
  RefreshControl,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db, storage } from "../config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { getAuth } from "firebase/auth";
import Icon from "react-native-vector-icons/FontAwesome";

// Componente da tela de cadastro de medicamentos
const MedicationScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [nomeMedicamento, setNomeMedicamento] = useState("");
  const [typeConcentration, setTypeConcentration] = useState("");
  const [typeDosage, setTypeDosage] = useState("");
  const [typeMedicines, setTypeMedicines] = useState("");
  const [typesConcentration, setTypesConcentration] = useState([]);
  const [typesDosage, setTypesDosage] = useState([]);
  const [typesMedicines, setTypesMedicines] = useState([]);
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMedicationId, setCurrentMedicationId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);  // Estado para controlar a atualização


  const fetchTypes = async (collectionName) => {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.reduce(
      (acc, doc) => ({
        ...acc,
        [doc.id]: doc.data().type,
      }),
      {}
    );
  };

  const fetchTypeData = async () => {
    const typeConcentrationMap = await fetchTypes("TypeConcentration");
    const typesDosageMap = await fetchTypes("TypeDosage");
    const typesMedicinesMap = await fetchTypes("typeMedicines");

    return { typeConcentrationMap, typesDosageMap, typesMedicinesMap };
  };

  const fetchAndEnrichMedications = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const userID = auth.currentUser ? auth.currentUser.uid : null;
      if (!userID) {
        console.log("Nenhum usuário autenticado.");
        setIsLoading(false);
        return;
      }
  
      const { typeConcentrationMap, typesDosageMap, typesMedicinesMap } = await fetchTypeData();
      
      // Agora inclui uma filtragem baseada no userID
      const queryRef = query(collection(db, "medicines"), where("ID_users", "==", userID));
      const querySnapshot = await getDocs(queryRef);
      
      const enrichedMedications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          TypeConcentrationLabel: typeConcentrationMap[data.TypeConcentration] || "Desconhecido",
          TypeDosageLabel: typesDosageMap[data.TypeDosage] || "Desconhecido",
          TypeMedicinesLabel: typesMedicinesMap[data.TypeMedicines] || "Desconhecido",
        };
      }).sort((a, b) => a.Nome_Medicamento.localeCompare(b.Nome_Medicamento));
  
      setMedications(enrichedMedications);
    } catch (error) {
      console.error('Error fetching medications', error);
    }
    setIsLoading(false);
  };
  

  useEffect(() => {
    async function fetchTypeData() {
      const typeConcentrationMap = await fetchTypes("TypeConcentration");
      const typesDosageMap = await fetchTypes("TypeDosage");
      const typesMedicinesMap = await fetchTypes("typeMedicines");

      return { typeConcentrationMap, typesDosageMap, typesMedicinesMap };
    }

    fetchAndEnrichMedications();
  }, []);

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

  // Função para enviar o medicamento para o banco de dados
  const handleSaveMedication = async () => {
    if (!selectedImage || !typeConcentration || !typeMedicines || !typeDosage) {
      alert("Por favor, preencha todos os campos e selecione uma imagem.");
      return;
    }

    setIsLoading(true);

    let imageUrl = selectedImage;
    if (
      typeof selectedImage === "string" &&
      !selectedImage.startsWith("https://")
    ) {
      // A imagem é nova e precisa ser carregada
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const fileRef = ref(
        storage,
        `Medication_Images/${new Date().toISOString()}`
      );
      await uploadBytes(fileRef, blob);
      imageUrl = await getDownloadURL(fileRef);
    }

    const auth = getAuth();
    const userID = auth.currentUser ? auth.currentUser.uid : "";

    const medicationData = {
      ID_users: userID,
      Nome_Medicamento: nomeMedicamento,
      TypeConcentration: typeConcentration,
      TypeMedicines: typeMedicines,
      TypeDosage: typeDosage,
      MedicationImage: imageUrl,
    };

    if (currentMedicationId) {
      // Atualiza um documento existente
      const medicationRef = doc(db, "medicines", currentMedicationId);
      await updateDoc(medicationRef, medicationData);
      alert("Medicamento atualizado com sucesso.");
    } else {
      // Adiciona um novo documento
      await addDoc(collection(db, "medicines"), medicationData);
      alert("Medicamento cadastrado com sucesso.");
    }

    // Resetar estado e fechar modal após sucesso
    resetFormAndCloseModal();
    fetchAndEnrichMedications(); // Rebusca os medicamentos após a atualização ou adição
    setIsLoading(false);
  };

  const resetFormAndCloseModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
    setNomeMedicamento("");
    setTypeConcentration("");
    setTypeMedicines("");
    setTypeDosage("");
    alert("Medicamento cadastrado com sucesso.");
  };

  const fetchAndSetTypes = async () => {
    setIsLoading(true);
    try {
      const typeConcentrationMap = await fetchTypes("TypeConcentration");
      const typesDosageMap = await fetchTypes("TypeDosage");
      const typesMedicinesMap = await fetchTypes("typeMedicines");

      setTypesConcentration(
        Object.entries(typeConcentrationMap).map(([key, value]) => ({
          label: value,
          value: key,
        }))
      );
      setTypesDosage(
        Object.entries(typesDosageMap).map(([key, value]) => ({
          label: value,
          value: key,
        }))
      );
      setTypesMedicines(
        Object.entries(typesMedicinesMap).map(([key, value]) => ({
          label: value,
          value: key,
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar os tipos: ", error);
    }
    setIsLoading(false);
  };

  // Função para editar um medicamento
  const editMedication = async (medication) => {
    await fetchAndSetTypes(); // Garante que as últimas opções de tipos sejam buscadas

    setNomeMedicamento(medication.Nome_Medicamento);
    setTypeConcentration(medication.TypeConcentration);
    setTypeDosage(medication.TypeDosage);
    setTypeMedicines(medication.TypeMedicines);
    setSelectedImage(medication.MedicationImage);
    setCurrentMedicationId(medication.id);
    setModalVisible(true);
  };

  // Função para abrir o modal e adicionar um novo medicamento
  const openModalToAdd = async () => {
    await fetchAndSetTypes(); // Garante que as últimas opções de tipos sejam buscadas
    resetForm();
    setModalVisible(true);
  };

  const resetForm = () => {
    // Reseta os campos do formulário
    setSelectedImage(null);
    setNomeMedicamento("");
    setTypeConcentration("");
    setTypeMedicines("");
    setTypeDosage("");
    setCurrentMedicationId(""); // Limpa o ID do medicamento atual, se estiver editando
  };

  const deleteMedication = async (id) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza de que deseja excluir este medicamento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "medicines", id));
              alert("Medicamento excluído com sucesso.");
              fetchAndEnrichMedications(); // Utilize o nome correto da função aqui
            } catch (error) {
              console.error("Erro ao excluir medicamento: ", error);
              alert("Ocorreu um erro ao tentar excluir o medicamento.");
            }
          },
        },
      ]
    );
  };
  // Função para renderizar cada item da lista de medicamentos
  const renderMedication = ({ item }) => (
    <View style={styles.medicationCard}>
      <Image source={{ uri: item.MedicationImage }} style={styles.cardImage} />
      <View style={styles.medicationInfo}>
        <Text style={styles.cardText}>
          <Text style={styles.boldText}>Nome:</Text> {item.Nome_Medicamento}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.boldText}>Tipo de Concentração:</Text>{" "}
          {item.TypeConcentrationLabel}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.boldText}>Tipo de Medicamento:</Text>{" "}
          {item.TypeMedicinesLabel}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.boldText}>Tipo de Dosagem:</Text>{" "}
          {item.TypeDosageLabel}
        </Text>
      </View>
      <View style={styles.iconContainer}>
        <View style={styles.iconWithLabel}>
          <TouchableOpacity onPress={() => editMedication(item)}>
            <Icon name="edit" size={24} color="blue" />
            <Text style={styles.iconLabel}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconWithLabel}>
          <TouchableOpacity onPress={() => deleteMedication(item.id)}>
            <Icon name="trash" size={24} color="red" />
            <Text style={styles.iconLabel}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

 // Função para atualizar os dados
 const onRefresh = React.useCallback(async () => {
  setRefreshing(true);
  await fetchAndEnrichMedications();  // Função que busca os dados
  setRefreshing(false);  // Finaliza a atualização
}, []);


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={openModalToAdd}>
        <Text style={styles.addButtonText}>Adicionar Medicamento</Text>
      </TouchableOpacity>

      <FlatList
        data={medications}
        renderItem={renderMedication}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalView}>
          <ScrollView
            style={styles.scrollViewStyle}
            contentContainerStyle={styles.scrollViewContent}
          >
            <Text style={styles.label}>Nome do Medicamento</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do Medicamento"
              onChangeText={setNomeMedicamento}
              value={nomeMedicamento}
            />

            <Text style={styles.label}>Tipo de Concentração</Text>

            <Picker
              selectedValue={typeConcentration}
              style={styles.picker}
              onValueChange={(itemValue, itemIndex) =>
                setTypeConcentration(itemValue)
              }
            >
              {typesConcentration.map((type) => (
                <Picker.Item
                  key={type.value}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
            <Text style={styles.label}>Tipo de Medicamento</Text>
            <Picker
              selectedValue={typeMedicines}
              style={styles.picker}
              onValueChange={(itemValue, itemIndex) =>
                setTypeMedicines(itemValue)
              }
            >
              {typesMedicines.map((type) => (
                <Picker.Item
                  key={type.value}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
            <Text style={styles.label}>Tipo de Dosagem</Text>
            <Picker
              selectedValue={typeDosage}
              style={styles.picker}
              onValueChange={(itemValue, itemIndex) => setTypeDosage(itemValue)}
            >
              {typesDosage.map((type) => (
                <Picker.Item
                  key={type.value}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
            <View style={styles.imagePickerContainer}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                />
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.imageButton, styles.buttonSpacing]}
                  onPress={handleChoosePhoto}
                >
                  <Text style={styles.buttonText}>Escolher Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.buttonText}>Tirar Foto</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !selectedImage && { backgroundColor: "gray" },
                  styles.buttonSpacing,
                ]}
                onPress={handleSaveMedication} // Aqui você usa a função handleSaveMedication
                disabled={!selectedImage}
              >
                <Text style={styles.buttonText}>Salvar Medicamento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};
// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalView: {
    marginTop: 100, // Ajuste conforme necessário para posicionar o modal na tela
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%", // Ajuste para ocupar a largura desejada
    maxHeight: "80%", // Ajuste para controlar a altura máxima e evitar sobreposição
  },

  scrollViewStyle: {
    width: "100%",
  },

  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
  },

  input: {
    width: "80%",
    padding: 13,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  picker: {
    width: "80%",
    marginVertical: -30,
  },
  imagePickerContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  imageButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSpacing: {
    marginRight: 10, // Ajuste o espaçamento conforme necessário
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%", // Garante que os botões ocupem a largura total do ScrollView
    paddingHorizontal: 20, // Adiciona um padding horizontal para alinhar com o resto do conteúdo
  },

  medicationList: {
    paddingHorizontal: 10,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  medicationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardImage: {
    width: 80,
    height: 90,
    borderRadius: 25,
  },
  medicationInfo: {
    flex: 1,
    marginLeft: 20,
  },
  cardText: {
    fontSize: 14,
    color: "#333",
  },
  boldText: {
    fontWeight: "bold",
  },
  iconContainer: {
    marginLeft: 10,
  },

  iconWithLabel: {
    alignItems: "center",
    marginTop: 5, // Ajuste o espaçamento vertical conforme necessário
  },

  iconLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  icon: {
    marginLeft: 10,
  },
});

export default MedicationScreen;
