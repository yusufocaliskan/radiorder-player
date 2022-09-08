import React, { useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Modal,
  Dimensions,
} from "react-native";
import color from "../misc/color";
const LanguageModal = ({ showIt, closeIt, selectTR, selectEN }) => {
  return (
    <Modal transparent={true} animationType="slide" visible={showIt}>
      <TouchableOpacity onPress={closeIt}>
        <View style={styles.overview}></View>
      </TouchableOpacity>
      <View style={styles.modalView}>
        <Text style={styles.modalTitle}>Select Language</Text>
        <View style={styles.optionsView}>
          <TouchableOpacity style={styles.option} onPress={selectTR}>
            <Text style={styles.optionText}>Türkçe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={selectEN}>
            <Text style={styles.optionText}>English</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const { height, width } = Dimensions.get("window");
const styles = StyleSheet.create({
  modalView: {
    backgroundColor: color.RED,
    position: "absolute",
    width: width,
    minHeight: 250,
    bottom: 0,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 20,
    zIndex: 999,
    elevation: 999,
  },
  modalTitle: {
    color: color.DARK_RED,
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
    alignSelf: "center",
  },
  optionsView: {
    marginTop: 10,
  },
  option: {
    marginBottom: 5,
    padding: 10,
    opacity: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: color.LIGHT_RED,
  },
  optionText: {
    textAlign: "center",
    fontSize: 18,
    color: color.WHITE,
  },
  overview: {
    backgroundColor: color.BLACK,
    zIndex: 888,
    position: "absolute",
    width: width,
    height: height,
    top: 0,
    left: 0,
    opacity: 0.2,
  },
});

export default LanguageModal;
