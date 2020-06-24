import {registerDecorator, ValidationOptions, ValidationArguments} from "class-validator";
import Web3 from "web3";

export const IsValidEthereumPrivateKeyFor = (
    addressProperty: string,
    options: ValidationOptions
) => (
    object: object,
    propertyName: string
) => registerDecorator({
    name: "isValidEthereumPrivateKey",
    target: object.constructor,
    propertyName,
    options,
    constraints: [addressProperty],
    validator: {
        validate(value: any, validationArguments?: ValidationArguments): boolean {
            const [relatedPropertyName] = validationArguments.constraints;
            const address = (validationArguments.object as any)[relatedPropertyName];

            try {
                return new Web3().eth.accounts.privateKeyToAccount(value).address === address;
            } catch (error) {
                return false;
            }
        }
    }
});
