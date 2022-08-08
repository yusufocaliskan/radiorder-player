import React, { Component } from "react";
import { Text, View } from "react-native";

export class AudioProvider extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.getPermission();
  }
  render() {
    return (
      <View>
        <Text> Silav! </Text>
      </View>
    );
  }
}

export default AudioProvider;
