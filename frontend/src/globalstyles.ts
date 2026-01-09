// globalStyles.js
import { StyleSheet, Dimensions } from 'react-native';
import { theme } from './theme';

const { width: screenWidth } = Dimensions.get('window');


export const globalStyles = StyleSheet.create({
    main: {
        backgroundColor: theme.colors.mono,
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: screenWidth * 0.10,
    },

    userform: {
        alignItems: 'flex-start',
    },


    titleUnderline: {
        width: 85,
        height: 3,
        backgroundColor: theme.colors.highlight,
        borderRadius: theme.radii.sm,
        marginBottom: theme.spacing.xl,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
    },




    // ==== textStyles ====

    TextLabel: {
        fontSize: theme.typography.fontSize.text,
        color: theme.colors.text.primary,
        marginBottom: 8,
        alignSelf: "flex-start",
        fontFamily: "Rubik",
        marginTop: theme.spacing.sm,
    },

    textInput: {
        flex: 1,
        fontSize: theme.typography.fontSize.text,
        color: theme.colors.text.primary,
        marginLeft: 12,
        fontFamily: theme.typography.fontFamily.primary,
    },

    textTitle: {
        fontSize: theme.typography.fontSize.highlight,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.primary,
    },

    textError: {
        color: "#cc0000",
        marginBottom: theme.spacing.md,
        fontSize: theme.typography.fontSize.text,
        fontFamily: theme.typography.fontFamily.primary,
    },



    // ==== buttonStyles ====

    primaryButton: {
        backgroundColor: theme.colors.highlight,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radii.md,
        alignItems: "center",
        width: "100%",
        marginBottom: 24,
    },

    primaryButtonDisabled: {
        opacity: 0.7,
    },
  
    primaryButtonText: {
        color: "#fff",
        fontSize: theme.typography.fontSize.text,
        fontWeight: theme.typography.fontWeight.bold,
        fontFamily: theme.typography.fontFamily.primary,
    },
});
